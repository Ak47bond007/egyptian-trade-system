from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import json

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    department = db.relationship('Department', foreign_keys=[department_id], backref='users')

class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    head_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    head = db.relationship('User', foreign_keys=[head_id], post_update=True)

class Contact(db.Model):
    __tablename__ = 'contacts'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    organization = db.Column(db.String(200))
    position = db.Column(db.String(100))
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    notes = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', backref='created_contacts')

class Correspondence(db.Model):
    __tablename__ = 'correspondences'
    id = db.Column(db.Integer, primary_key=True)
    reference_number = db.Column(db.String(50), unique=True, nullable=False)
    subject = db.Column(db.String(300), nullable=False)
    content = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'incoming' or 'outgoing'
    priority = db.Column(db.String(20), default='normal')  # 'high', 'normal', 'low'
    status = db.Column(db.String(20), default='pending')  # 'pending', 'processed', 'archived'
    
    # Contact information
    sender_id = db.Column(db.Integer, db.ForeignKey('contacts.id'), nullable=True)
    recipient_id = db.Column(db.Integer, db.ForeignKey('contacts.id'), nullable=True)
    sender_external = db.Column(db.String(200))  # For external senders not in contacts
    recipient_external = db.Column(db.String(200))  # For external recipients
    
    # Dates
    correspondence_date = db.Column(db.Date, nullable=False)
    received_date = db.Column(db.Date)
    due_date = db.Column(db.Date)
    
    # Internal tracking
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sender = db.relationship('Contact', foreign_keys=[sender_id], backref='sent_correspondences')
    recipient = db.relationship('Contact', foreign_keys=[recipient_id], backref='received_correspondences')
    department = db.relationship('Department', backref='correspondences')
    assignee = db.relationship('User', foreign_keys=[assigned_to], backref='assigned_correspondences')
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_correspondences')

class Attachment(db.Model):
    __tablename__ = 'attachments'
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    correspondence_id = db.Column(db.Integer, db.ForeignKey('correspondences.id'), nullable=False)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    correspondence = db.relationship('Correspondence', backref='attachments')
    uploader = db.relationship('User', backref='uploaded_attachments')

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)  # 'correspondence', 'contact', etc.
    entity_id = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text)
    metadata_json = db.Column(db.Text)  # JSON string for additional data
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='activity_logs')
    
    def set_metadata(self, data):
        self.metadata_json = json.dumps(data)
    
    def get_metadata(self):
        return json.loads(self.metadata_json) if self.metadata_json else {}

class SystemSetting(db.Model):
    __tablename__ = 'system_settings'
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text)
    description = db.Column(db.Text)
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
