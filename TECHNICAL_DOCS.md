# Egyptian Trade System - Technical Documentation

## System Architecture

### Overview
The Egyptian Trade System is a comprehensive correspondence management system built with Flask and designed specifically for the Egyptian Commercial Representation offices. It provides a complete solution for managing incoming and outgoing correspondence with real-time collaboration features.

### Technology Stack

#### Backend
- **Flask 2.3.3** - Web framework
- **SQLAlchemy 2.0.43** - Database ORM
- **Flask-Login 0.6.3** - User authentication and session management
- **Flask-SocketIO 5.3.6** - Real-time WebSocket communication
- **Flask-WTF 1.1.1** - Form handling and CSRF protection
- **OpenPyXL 3.1.2** - Excel file processing
- **Python-SocketIO 5.8.0** - Server-side WebSocket implementation

#### Frontend
- **Bootstrap 5.3.0** - Responsive UI framework
- **Bootstrap Icons 1.10.0** - Icon library
- **Socket.IO 4.7.2** - Client-side WebSocket communication
- **Custom CSS** - RTL Arabic styling with Egyptian branding
- **Vanilla JavaScript** - Clean, dependency-free interactions

#### Database
- **SQLite** - Lightweight, file-based database for development
- **Production Ready** - Can be easily migrated to PostgreSQL or MySQL

## Database Schema

### Core Models

#### User Model
```python
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

#### Correspondence Model
```python
class Correspondence(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    reference_number = db.Column(db.String(50), unique=True, nullable=False)
    subject = db.Column(db.String(300), nullable=False)
    content = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'incoming' or 'outgoing'
    priority = db.Column(db.String(20), default='normal')
    status = db.Column(db.String(20), default='pending')
    correspondence_date = db.Column(db.Date, nullable=False)
    received_date = db.Column(db.Date)
    due_date = db.Column(db.Date)
    # ... additional fields
```

### Relationships
- **User ↔ Department**: Many-to-One relationship
- **Correspondence ↔ User**: Many-to-One (created_by, assigned_to)
- **Correspondence ↔ Contact**: Many-to-One (sender, recipient)
- **Correspondence ↔ Attachment**: One-to-Many
- **User ↔ ActivityLog**: One-to-Many

## API Endpoints

### Authentication Routes
- `GET, POST /` - Login page
- `GET, POST /login` - User authentication
- `GET /logout` - User logout

### Core Application Routes
- `GET /dashboard` - Main dashboard with statistics
- `GET /correspondences` - List correspondences with filtering
- `GET /correspondences/add` - Add new correspondence form
- `POST /correspondences/add` - Create new correspondence
- `GET /correspondences/<id>` - View correspondence details
- `GET /correspondences/<id>/edit` - Edit correspondence form
- `POST /correspondences/<id>/edit` - Update correspondence
- `POST /correspondences/<id>/delete` - Delete correspondence

### API Routes (JSON)
- `POST /api/contacts` - Create new contact
- `POST /api/bulk-update-status` - Update multiple correspondences
- `POST /api/bulk-delete` - Delete multiple correspondences
- `GET /api/export/excel` - Export data to Excel
- `GET /api/export/json` - Export data to JSON
- `POST /api/import` - Import data from file
- `GET /api/backup` - Create database backup
- `POST /api/postman/chat` - Smart Postman chat API

### WebSocket Events
- `join` - User joins real-time room
- `correspondence_added` - New correspondence created
- `correspondence_updated` - Correspondence modified
- `correspondence_deleted` - Correspondence removed
- `sync_start/complete/error` - Synchronization events

## Features Implementation

### 1. Real-time Collaboration
```javascript
// Client-side Socket.IO integration
socket.on('correspondence_added', function(data) {
    showNotification(`تم إضافة مراسلة جديدة: ${data.subject}`, 'success');
    updateCorrespondenceList(data, 'added');
});
```

### 2. Smart Postman Chat
The intelligent chat assistant provides contextual help and can:
- Search correspondences with natural language
- Provide system navigation assistance
- Generate reports and statistics
- Execute system actions based on user requests

### 3. File Upload System
```python
# Secure file handling with validation
filename = secure_filename(file.filename)
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
filename = timestamp + filename
file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
```

### 4. Advanced Search & Filtering
- Real-time search across multiple fields
- Dynamic filtering with AJAX updates
- Pagination with proper Arabic support
- Export filtered results

### 5. Data Import/Export
- Excel export with Arabic formatting
- JSON export for system integration
- Bulk import with validation
- Backup and restore functionality

## Security Features

### Authentication & Authorization
- Secure password hashing with Werkzeug
- Session-based authentication via Flask-Login
- Role-based access control
- Activity logging for audit trails

### Input Validation
- Server-side form validation
- File type and size restrictions
- SQL injection prevention via ORM
- XSS protection with Jinja2 auto-escaping

### Data Protection
- Local data storage (no external data transmission)
- Secure file upload handling
- Session security with proper timeouts
- Activity monitoring and logging

## Deployment Guide

### Development Setup
```bash
# Clone repository
git clone https://github.com/Ak47bond007/egyptian-trade-system.git
cd egyptian-trade-system

# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py
```

### Production Deployment
```bash
# Install production WSGI server
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Or use systemd service
sudo systemctl start egyptian-trade-system
```

### Environment Variables
```bash
# Optional configuration
export FLASK_ENV=production
export SECRET_KEY=your-production-secret-key
export DATABASE_URL=sqlite:///production.db
```

## Customization & Extension

### Adding New Features
1. Create new models in `models.py`
2. Add routes in `app.py`
3. Create templates in `templates/`
4. Update frontend JavaScript in `static/js/`

### Branding Customization
- Logo replacement in `static/images/`
- Color scheme in `static/css/style.css`
- Text content in templates

### Database Migration
For production databases:
```python
# Add Flask-Migrate for schema changes
from flask_migrate import Migrate
migrate = Migrate(app, db)
```

## Performance Optimization

### Database Optimization
- Proper indexing on frequently queried fields
- Relationship loading optimization
- Query result pagination

### Frontend Optimization
- Asset minification and compression
- Browser caching for static files
- Lazy loading for large datasets

### Real-time Performance
- Efficient WebSocket event handling
- Selective room-based updates
- Connection pooling for multiple users

## Monitoring & Maintenance

### Logging
- Application logs for debugging
- Activity logs for user actions
- Error tracking and reporting

### Backup Strategy
- Automated daily backups
- File attachment backup
- Database backup verification

### Health Monitoring
- System status dashboard
- Connection monitoring
- Performance metrics

## Troubleshooting

### Common Issues
1. **Database locked**: Usually resolved by restarting the application
2. **File upload failures**: Check file size and permissions
3. **WebSocket connection issues**: Verify network configuration

### Debug Mode
```python
# Enable detailed error messages
app.config['DEBUG'] = True
```

### Log Analysis
Check application logs for detailed error information:
```bash
tail -f egyptian_trade_system.log
```

## Future Enhancements

### Planned Features
- Mobile application development
- Advanced reporting dashboard
- Email notification system
- API for third-party integrations
- Multi-language support expansion

### Scalability Improvements
- Database clustering support
- Load balancer integration
- Microservices architecture
- Cloud deployment options

---

## Technical Support

For technical support and development inquiries:
- Review this documentation
- Check the user guide in `USER_GUIDE.md`
- Examine code comments for implementation details
- Use the Smart Postman feature for quick help

**System developed for the Egyptian Commercial Representation - Ministry of Investment and Foreign Trade**