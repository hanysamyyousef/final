from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Profile, CustomRole
from .serializers import UserSerializer, ProfileSerializer, CustomRoleSerializer
from rolepermissions.roles import get_user_roles, assign_role, remove_role

class CustomRoleViewSet(viewsets.ModelViewSet):
    queryset = CustomRole.objects.all()
    serializer_class = CustomRoleSerializer
    permission_classes = [permissions.IsAuthenticated]

class UserViewSet(viewsets.ModelViewSet):
from rolepermissions.permissions import grant_permission, revoke_permission, available_perm_status

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related('profile').order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(profile__role=role)
        return queryset

    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        user = self.get_object()
        new_role = request.data.get('role')
        
        if not new_role:
            return Response({'error': 'Role is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Update Profile
        profile = user.profile
        old_role = profile.role
        profile.role = new_role
        profile.save()
        
        # Update django-role-permissions
        # First remove old roles
        for role in get_user_roles(user):
            remove_role(user, role)
        
        # Assign new role
        assign_role(user, new_role)
        
        return Response({'status': 'Role updated successfully'})

    @action(detail=False, methods=['get'])
    def roles_list(self, request):
        from rolepermissions.roles import RolesManager
        
        roles_data = []
        
        # Dictionary to translate permission keys to Arabic display names
        permission_translations = {
            # Users
            'create_user': 'إضافة مستخدم',
            'edit_user': 'تعديل مستخدم',
            'delete_user': 'حذف مستخدم',
            'view_users': 'عرض المستخدمين',
            # Companies
            'create_company': 'إضافة شركة',
            'edit_company': 'تعديل شركة',
            'delete_company': 'حذف شركة',
            'view_companies': 'عرض الشركات',
            # Branches
            'create_branch': 'إضافة فرع',
            'edit_branch': 'تعديل فرع',
            'delete_branch': 'حذف فرع',
            'view_branches': 'عرض الفروع',
            # Stores
            'create_store': 'إضافة مخزن',
            'edit_store': 'تعديل مخزن',
            'delete_store': 'حذف مخزن',
            'view_stores': 'عرض المخازن',
            # Safes
            'create_safe': 'إضافة خزينة',
            'edit_safe': 'تعديل خزينة',
            'delete_safe': 'حذف خزينة',
            'view_safes': 'عرض الخزائن',
            # Contacts
            'create_contact': 'إضافة جهة اتصال',
            'edit_contact': 'تعديل جهة اتصال',
            'delete_contact': 'حذف جهة اتصال',
            'view_contacts': 'عرض جهات الاتصال',
            # Products
            'create_product': 'إضافة منتج',
            'edit_product': 'تعديل منتج',
            'delete_product': 'حذف منتج',
            'view_products': 'عرض المنتجات',
            # Invoices
            'create_invoice': 'إضافة فاتورة',
            'edit_invoice': 'تعديل فاتورة',
            'delete_invoice': 'حذف فاتورة',
            'view_invoices': 'عرض الفواتير',
            # Transactions
            'create_transaction': 'إضافة معاملة',
            'edit_transaction': 'تعديل معاملة',
            'delete_transaction': 'حذف معاملة',
            'view_transactions': 'عرض المعاملات',
            # Reports & Data
            'view_reports': 'عرض التقارير',
            'export_data': 'تصدير البيانات',
            'import_data': 'استيراد البيانات',
        }
        
        for role_class in RolesManager.get_roles():
            role_id = role_class.get_name()
            display_names = {
                'admin': 'مدير النظام',
                'manager': 'مدير',
                'employee': 'موظف',
                'viewer': 'مشاهد'
            }
            
            # Get permissions from the role class
            raw_permissions = getattr(role_class, 'available_permissions', {})
            
            # Create a translated permissions dictionary
            translated_permissions = {}
            for perm_key, is_available in raw_permissions.items():
                translated_permissions[perm_key] = {
                    'name': permission_translations.get(perm_key, perm_key),
                    'granted': is_available
                }
            
            roles_data.append({
                'id': role_id,
                'name': display_names.get(role_id, role_id),
                'permissions': translated_permissions, # Return dictionary with name and granted status
                'description': f"إدارة {'كاملة' if role_id == 'admin' else 'محدودة'} لكافة أقسام النظام والتقارير"
            })
            
        return Response(roles_data)

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({'status': 'Status updated', 'is_active': user.is_active})

    @action(detail=True, methods=['get'])
    def user_permissions(self, request, pk=None):
        user = self.get_object()
        
        # Get all permissions defined in roles.py
        from .roles import Admin
        all_possible_permissions = Admin.available_permissions.keys()
        
        # Get current status for this specific user
        # available_perm_status returns {perm_name: boolean}
        current_status = available_perm_status(user)
        
        # We also need to know if a permission is coming from a role or was specifically granted
        user_roles = get_user_roles(user)
        role_permissions = set()
        for role in user_roles:
            for perm, granted in role.available_permissions.items():
                if granted:
                    role_permissions.add(perm)
        
        permissions_data = []
        
        # Use the translation map from roles_list for consistency
        permission_translations = {
            'create_user': 'إضافة مستخدم', 'edit_user': 'تعديل مستخدم', 'delete_user': 'حذف مستخدم', 'view_users': 'عرض المستخدمين',
            'create_company': 'إضافة شركة', 'edit_company': 'تعديل شركة', 'delete_company': 'حذف شركة', 'view_companies': 'عرض الشركات',
            'create_branch': 'إضافة فرع', 'edit_branch': 'تعديل فرع', 'delete_branch': 'حذف فرع', 'view_branches': 'عرض الفروع',
            'create_store': 'إضافة مخزن', 'edit_store': 'تعديل مخزن', 'delete_store': 'حذف مخزن', 'view_stores': 'عرض المخازن',
            'create_safe': 'إضافة خزينة', 'edit_safe': 'تعديل خزينة', 'delete_safe': 'حذف خزينة', 'view_safes': 'عرض الخزائن',
            'create_contact': 'إضافة جهة اتصال', 'edit_contact': 'تعديل جهة اتصال', 'delete_contact': 'حذف جهة اتصال', 'view_contacts': 'عرض جهات الاتصال',
            'create_product': 'إضافة منتج', 'edit_product': 'تعديل منتج', 'delete_product': 'حذف منتج', 'view_products': 'عرض المنتجات',
            'create_invoice': 'إضافة فاتورة', 'edit_invoice': 'تعديل فاتورة', 'delete_invoice': 'حذف فاتورة', 'view_invoices': 'عرض الفواتير',
            'create_transaction': 'إضافة معاملة', 'edit_transaction': 'تعديل معاملة', 'delete_transaction': 'حذف معاملة', 'view_transactions': 'عرض المعاملات',
            'view_reports': 'عرض التقارير', 'export_data': 'تصدير البيانات', 'import_data': 'استيراد البيانات',
        }
        
        for perm in all_possible_permissions:
            is_granted = current_status.get(perm, False)
            is_from_role = perm in role_permissions
            
            permissions_data.append({
                'key': perm,
                'name': permission_translations.get(perm, perm),
                'granted': is_granted,
                'from_role': is_from_role
            })
            
        return Response(permissions_data)

    @action(detail=True, methods=['post'])
    def update_user_permissions(self, request, pk=None):
        user = self.get_object()
        permissions_to_update = request.data.get('permissions', {}) # {perm_key: boolean}
        
        for perm_key, should_grant in permissions_to_update.items():
            if should_grant:
                try:
                    grant_permission(user, perm_key)
                except:
                    pass
            else:
                try:
                    revoke_permission(user, perm_key)
                except:
                    pass
                    
        return Response({'status': 'Permissions updated successfully'})
