from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, send_file
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import json
from datetime import datetime, date
from models import *
import openpyxl
from openpyxl.styles import Font, Alignment
from io import BytesIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///egyptian_trade_system.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize extensions
db.init_app(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Create tables
with app.app_context():
    db.create_all()
    
    # Create default admin user if not exists
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            username='admin',
            password_hash=generate_password_hash('admin123'),
            full_name='مدير النظام',
            email='admin@ecs.gov.eg'
        )
        db.session.add(admin)
        
        # Create default department
        dept = Department(name='الإدارة العامة', description='الإدارة الرئيسية للنظام')
        db.session.add(dept)
        db.session.commit()
        
        admin.department_id = dept.id
        db.session.commit()

@app.route('/', methods=['GET', 'POST'])
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('خطأ في اسم المستخدم أو كلمة المرور')
    
    return render_template('login.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('خطأ في اسم المستخدم أو كلمة المرور')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    # Get statistics for dashboard
    total_correspondences = Correspondence.query.count()
    pending_correspondences = Correspondence.query.filter_by(status='pending').count()
    total_contacts = Contact.query.count()
    total_departments = Department.query.count()
    
    recent_correspondences = Correspondence.query.order_by(
        Correspondence.created_at.desc()
    ).limit(5).all()
    
    stats = {
        'total_correspondences': total_correspondences,
        'pending_correspondences': pending_correspondences,
        'total_contacts': total_contacts,
        'total_departments': total_departments,
        'recent_correspondences': recent_correspondences
    }
    
    return render_template('dashboard.html', stats=stats)

@app.route('/correspondences')
@login_required
def correspondences():
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '')
    type_filter = request.args.get('type', '')
    status_filter = request.args.get('status', '')
    department_filter = request.args.get('department', '')
    
    query = Correspondence.query
    
    if search:
        query = query.filter(
            db.or_(
                Correspondence.subject.contains(search),
                Correspondence.reference_number.contains(search),
                Correspondence.content.contains(search)
            )
        )
    
    if type_filter:
        query = query.filter(Correspondence.type == type_filter)
    
    if status_filter:
        query = query.filter(Correspondence.status == status_filter)
    
    if department_filter:
        query = query.filter(Correspondence.department_id == department_filter)
    
    correspondences = query.order_by(Correspondence.created_at.desc()).paginate(
        page=page, per_page=20, error_out=False
    )
    
    departments = Department.query.all()
    
    return render_template('correspondences/list.html', 
                         correspondences=correspondences, 
                         departments=departments,
                         search=search,
                         type_filter=type_filter,
                         status_filter=status_filter,
                         department_filter=department_filter)

@app.route('/correspondences/add', methods=['GET', 'POST'])
@login_required
def add_correspondence():
    if request.method == 'POST':
        # Generate reference number
        last_ref = Correspondence.query.order_by(Correspondence.id.desc()).first()
        ref_num = f"ECS-{datetime.now().year}-{(last_ref.id + 1) if last_ref else 1:06d}"
        
        correspondence = Correspondence(
            reference_number=ref_num,
            subject=request.form['subject'],
            content=request.form['content'],
            type=request.form['type'],
            priority=request.form.get('priority', 'normal'),
            correspondence_date=datetime.strptime(request.form['correspondence_date'], '%Y-%m-%d').date(),
            department_id=request.form['department_id'],
            created_by=current_user.id
        )
        
        if request.form.get('sender_id'):
            correspondence.sender_id = request.form['sender_id']
        elif request.form.get('sender_external'):
            correspondence.sender_external = request.form['sender_external']
            
        if request.form.get('recipient_id'):
            correspondence.recipient_id = request.form['recipient_id']
        elif request.form.get('recipient_external'):
            correspondence.recipient_external = request.form['recipient_external']
        
        if request.form.get('received_date'):
            correspondence.received_date = datetime.strptime(request.form['received_date'], '%Y-%m-%d').date()
        
        if request.form.get('due_date'):
            correspondence.due_date = datetime.strptime(request.form['due_date'], '%Y-%m-%d').date()
        
        if request.form.get('assigned_to'):
            correspondence.assigned_to = request.form['assigned_to']
        
        db.session.add(correspondence)
        db.session.commit()
        
        # Handle file uploads
        if 'attachments' in request.files:
            files = request.files.getlist('attachments')
            for file in files:
                if file and file.filename:
                    filename = secure_filename(file.filename)
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
                    filename = timestamp + filename
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(file_path)
                    
                    attachment = Attachment(
                        filename=filename,
                        original_filename=file.filename,
                        file_path=file_path,
                        file_size=os.path.getsize(file_path),
                        mime_type=file.content_type or 'application/octet-stream',
                        correspondence_id=correspondence.id,
                        uploaded_by=current_user.id
                    )
                    db.session.add(attachment)
        
        db.session.commit()
        
        # Log activity
        log_activity('create', 'correspondence', correspondence.id, f'تم إنشاء مراسلة جديدة: {correspondence.subject}')
        
        # Emit real-time update
        socketio.emit('correspondence_added', {
            'id': correspondence.id,
            'reference_number': correspondence.reference_number,
            'subject': correspondence.subject,
            'type': correspondence.type
        }, room='all_users')
        
        flash('تم إضافة المراسلة بنجاح')
        return redirect(url_for('correspondences'))
    
    departments = Department.query.all()
    contacts = Contact.query.all()
    users = User.query.all()
    
    return render_template('correspondences/add.html', 
                         departments=departments, 
                         contacts=contacts, 
                         users=users)

@app.route('/correspondences/<int:id>')
@login_required
def view_correspondence(id):
    correspondence = Correspondence.query.get_or_404(id)
    return render_template('correspondences/view.html', correspondence=correspondence)

@app.route('/correspondences/<int:id>/edit', methods=['GET', 'POST'])
@login_required
def edit_correspondence(id):
    correspondence = Correspondence.query.get_or_404(id)
    
    if request.method == 'POST':
        correspondence.subject = request.form['subject']
        correspondence.content = request.form['content']
        correspondence.type = request.form['type']
        correspondence.priority = request.form.get('priority', 'normal')
        correspondence.status = request.form.get('status', 'pending')
        correspondence.correspondence_date = datetime.strptime(request.form['correspondence_date'], '%Y-%m-%d').date()
        correspondence.department_id = request.form['department_id']
        
        if request.form.get('sender_id'):
            correspondence.sender_id = request.form['sender_id']
            correspondence.sender_external = None
        elif request.form.get('sender_external'):
            correspondence.sender_external = request.form['sender_external']
            correspondence.sender_id = None
            
        if request.form.get('recipient_id'):
            correspondence.recipient_id = request.form['recipient_id']
            correspondence.recipient_external = None
        elif request.form.get('recipient_external'):
            correspondence.recipient_external = request.form['recipient_external']
            correspondence.recipient_id = None
        
        if request.form.get('received_date'):
            correspondence.received_date = datetime.strptime(request.form['received_date'], '%Y-%m-%d').date()
        else:
            correspondence.received_date = None
        
        if request.form.get('due_date'):
            correspondence.due_date = datetime.strptime(request.form['due_date'], '%Y-%m-%d').date()
        else:
            correspondence.due_date = None
        
        if request.form.get('assigned_to'):
            correspondence.assigned_to = request.form['assigned_to']
        else:
            correspondence.assigned_to = None
        
        correspondence.updated_at = datetime.utcnow()
        
        # Handle new file uploads
        if 'attachments' in request.files:
            files = request.files.getlist('attachments')
            for file in files:
                if file and file.filename:
                    filename = secure_filename(file.filename)
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
                    filename = timestamp + filename
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(file_path)
                    
                    attachment = Attachment(
                        filename=filename,
                        original_filename=file.filename,
                        file_path=file_path,
                        file_size=os.path.getsize(file_path),
                        mime_type=file.content_type or 'application/octet-stream',
                        correspondence_id=correspondence.id,
                        uploaded_by=current_user.id
                    )
                    db.session.add(attachment)
        
        db.session.commit()
        
        # Log activity
        log_activity('update', 'correspondence', correspondence.id, f'تم تحديث المراسلة: {correspondence.subject}')
        
        # Emit real-time update
        socketio.emit('correspondence_updated', {
            'id': correspondence.id,
            'reference_number': correspondence.reference_number,
            'subject': correspondence.subject,
            'status': correspondence.status
        }, room='all_users')
        
        flash('تم تحديث المراسلة بنجاح')
        return redirect(url_for('view_correspondence', id=id))
    
    departments = Department.query.all()
    contacts = Contact.query.all()
    users = User.query.all()
    
    return render_template('correspondences/edit.html', 
                         correspondence=correspondence,
                         departments=departments, 
                         contacts=contacts, 
                         users=users)

@app.route('/correspondences/<int:id>/delete', methods=['POST'])
@login_required
def delete_correspondence(id):
    correspondence = Correspondence.query.get_or_404(id)
    
    # Delete associated attachments
    for attachment in correspondence.attachments:
        if os.path.exists(attachment.file_path):
            os.remove(attachment.file_path)
        db.session.delete(attachment)
    
    # Log activity before deletion
    log_activity('delete', 'correspondence', correspondence.id, f'تم حذف المراسلة: {correspondence.subject}')
    
    db.session.delete(correspondence)
    db.session.commit()
    
    # Emit real-time update
    socketio.emit('correspondence_deleted', {
        'id': id
    }, room='all_users')
    
    flash('تم حذف المراسلة بنجاح')
    return redirect(url_for('correspondences'))

def log_activity(action, entity_type, entity_id, description, metadata=None):
    log = ActivityLog(
        user_id=current_user.id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description
    )
    if metadata:
        log.set_metadata(metadata)
    db.session.add(log)

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)