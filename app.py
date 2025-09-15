#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
نظام إدارة المكاتبات المصري - التمثيل التجاري
Egyptian Correspondence Management System - Commercial Representation
"""

import os
import uuid
import mimetypes
from datetime import datetime
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, render_template, request, redirect, url_for, flash, send_file, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# إعداد التطبيق
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'egyptian-trade-secret-key-2024')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///correspondence.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# إعداد مجلد الملفات المرفقة
UPLOAD_FOLDER = os.path.join(app.root_path, 'attachments')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# أنواع الملفات المسموحة
ALLOWED_EXTENSIONS = {
    'txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff',
    'zip', 'rar', '7z', 'mp4', 'avi', 'mov'
}

# إنشاء مجلد المرفقات إذا لم يكن موجوداً
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# إعداد قاعدة البيانات
db = SQLAlchemy(app)
migrate = Migrate(app, db)

def allowed_file(filename):
    """التحقق من أن نوع الملف مسموح"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_unique_filename(filename):
    """إنشاء اسم ملف فريد"""
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    unique_id = str(uuid.uuid4())
    return f"{unique_id}.{ext}" if ext else unique_id

# النماذج (Models)
class Correspondence(db.Model):
    """نموذج المكاتبات"""
    __tablename__ = 'correspondence'
    
    id = db.Column(db.Integer, primary_key=True)
    reference_number = db.Column(db.String(50), unique=True, nullable=False)
    subject = db.Column(db.String(500), nullable=False)
    content = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'incoming' or 'outgoing'
    sender = db.Column(db.String(200))
    recipient = db.Column(db.String(200))
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    date_received = db.Column(db.DateTime)
    priority = db.Column(db.String(20), default='normal')  # low, normal, high, urgent
    status = db.Column(db.String(20), default='pending')  # pending, processed, archived
    
    # علاقة مع المرفقات
    attachments = db.relationship('Attachment', backref='correspondence', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Correspondence {self.reference_number}>'

class Attachment(db.Model):
    """نموذج المرفقات"""
    __tablename__ = 'attachments'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)  # الاسم الأصلي
    secure_filename = db.Column(db.String(255), nullable=False)  # الاسم المحفوظ
    file_size = db.Column(db.Integer, nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    date_uploaded = db.Column(db.DateTime, default=datetime.utcnow)
    
    # مفتاح أجنبي للمكاتبة
    correspondence_id = db.Column(db.Integer, db.ForeignKey('correspondence.id'), nullable=False)
    
    def __repr__(self):
        return f'<Attachment {self.filename}>'

# الصفحات الرئيسية
@app.route('/')
def index():
    """الصفحة الرئيسية"""
    recent_correspondence = Correspondence.query.order_by(Correspondence.date_created.desc()).limit(10).all()
    total_incoming = Correspondence.query.filter_by(type='incoming').count()
    total_outgoing = Correspondence.query.filter_by(type='outgoing').count()
    total_attachments = Attachment.query.count()
    
    stats = {
        'total_incoming': total_incoming,
        'total_outgoing': total_outgoing,
        'total_correspondence': total_incoming + total_outgoing,
        'total_attachments': total_attachments
    }
    
    return render_template('index.html', 
                         correspondence=recent_correspondence, 
                         stats=stats)

@app.route('/correspondence')
def correspondence_list():
    """قائمة المكاتبات"""
    page = request.args.get('page', 1, type=int)
    type_filter = request.args.get('type', '')
    status_filter = request.args.get('status', '')
    
    query = Correspondence.query
    
    if type_filter:
        query = query.filter_by(type=type_filter)
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    correspondence = query.order_by(Correspondence.date_created.desc()).paginate(
        page=page, per_page=20, error_out=False)
    
    return render_template('correspondence_list.html', 
                         correspondence=correspondence,
                         type_filter=type_filter,
                         status_filter=status_filter)

@app.route('/correspondence/new', methods=['GET', 'POST'])
def new_correspondence():
    """إضافة مكاتبة جديدة"""
    if request.method == 'POST':
        try:
            # إنشاء رقم مرجعي فريد
            ref_number = f"ECS-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
            
            correspondence = Correspondence(
                reference_number=ref_number,
                subject=request.form['subject'],
                content=request.form['content'],
                type=request.form['type'],
                sender=request.form.get('sender', ''),
                recipient=request.form.get('recipient', ''),
                priority=request.form.get('priority', 'normal'),
                date_received=datetime.strptime(request.form['date_received'], '%Y-%m-%d') if request.form.get('date_received') else None
            )
            
            db.session.add(correspondence)
            db.session.flush()  # للحصول على ID
            
            # معالجة المرفقات
            if 'attachments' in request.files:
                files = request.files.getlist('attachments')
                for file in files:
                    if file and file.filename and allowed_file(file.filename):
                        # إنشاء اسم ملف آمن وفريد
                        secure_name = generate_unique_filename(file.filename)
                        file_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_name)
                        
                        # حفظ الملف
                        file.save(file_path)
                        
                        # حفظ معلومات المرفق في قاعدة البيانات
                        attachment = Attachment(
                            filename=file.filename,
                            secure_filename=secure_name,
                            file_size=os.path.getsize(file_path),
                            mime_type=mimetypes.guess_type(file.filename)[0] or 'application/octet-stream',
                            correspondence_id=correspondence.id
                        )
                        db.session.add(attachment)
            
            db.session.commit()
            flash('تم إضافة المكاتبة بنجاح', 'success')
            return redirect(url_for('view_correspondence', id=correspondence.id))
            
        except Exception as e:
            db.session.rollback()
            flash(f'حدث خطأ أثناء إضافة المكاتبة: {str(e)}', 'error')
    
    return render_template('correspondence_form.html')

@app.route('/correspondence/<int:id>')
def view_correspondence(id):
    """عرض مكاتبة"""
    correspondence = Correspondence.query.get_or_404(id)
    return render_template('correspondence_view.html', correspondence=correspondence)

@app.route('/correspondence/<int:id>/edit', methods=['GET', 'POST'])
def edit_correspondence(id):
    """تعديل مكاتبة"""
    correspondence = Correspondence.query.get_or_404(id)
    
    if request.method == 'POST':
        try:
            correspondence.subject = request.form['subject']
            correspondence.content = request.form['content']
            correspondence.type = request.form['type']
            correspondence.sender = request.form.get('sender', '')
            correspondence.recipient = request.form.get('recipient', '')
            correspondence.priority = request.form.get('priority', 'normal')
            correspondence.status = request.form.get('status', 'pending')
            
            if request.form.get('date_received'):
                correspondence.date_received = datetime.strptime(request.form['date_received'], '%Y-%m-%d')
            
            # معالجة المرفقات الجديدة
            if 'attachments' in request.files:
                files = request.files.getlist('attachments')
                for file in files:
                    if file and file.filename and allowed_file(file.filename):
                        secure_name = generate_unique_filename(file.filename)
                        file_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_name)
                        
                        file.save(file_path)
                        
                        attachment = Attachment(
                            filename=file.filename,
                            secure_filename=secure_name,
                            file_size=os.path.getsize(file_path),
                            mime_type=mimetypes.guess_type(file.filename)[0] or 'application/octet-stream',
                            correspondence_id=correspondence.id
                        )
                        db.session.add(attachment)
            
            db.session.commit()
            flash('تم تحديث المكاتبة بنجاح', 'success')
            return redirect(url_for('view_correspondence', id=id))
            
        except Exception as e:
            db.session.rollback()
            flash(f'حدث خطأ أثناء تحديث المكاتبة: {str(e)}', 'error')
    
    return render_template('correspondence_form.html', correspondence=correspondence)

@app.route('/attachment/<int:id>/download')
def download_attachment(id):
    """تحميل مرفق"""
    attachment = Attachment.query.get_or_404(id)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], attachment.secure_filename)
    
    if not os.path.exists(file_path):
        abort(404)
    
    return send_file(file_path, 
                    download_name=attachment.filename,
                    as_attachment=True)

@app.route('/attachment/<int:id>/view')
def view_attachment(id):
    """عرض مرفق"""
    attachment = Attachment.query.get_or_404(id)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], attachment.secure_filename)
    
    if not os.path.exists(file_path):
        abort(404)
    
    return send_file(file_path, 
                    download_name=attachment.filename,
                    as_attachment=False)

@app.route('/attachment/<int:id>/delete', methods=['POST'])
def delete_attachment(id):
    """حذف مرفق"""
    attachment = Attachment.query.get_or_404(id)
    correspondence_id = attachment.correspondence_id
    
    try:
        # حذف الملف من النظام
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], attachment.secure_filename)
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # حذف السجل من قاعدة البيانات
        db.session.delete(attachment)
        db.session.commit()
        
        flash('تم حذف المرفق بنجاح', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'حدث خطأ أثناء حذف المرفق: {str(e)}', 'error')
    
    return redirect(url_for('view_correspondence', id=correspondence_id))

@app.route('/correspondence/<int:id>/print')
def print_correspondence(id):
    """طباعة مكاتبة مع المرفقات"""
    correspondence = Correspondence.query.get_or_404(id)
    return render_template('correspondence_print.html', correspondence=correspondence)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0')