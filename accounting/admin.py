from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from mptt.admin import DraggableMPTTAdmin
from .models import Account, JournalEntry, JournalItem, CostCenter, FinancialPeriod, AuditLog, FixedAsset

@admin.register(FixedAsset)
class FixedAssetAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'acquisition_date', 'acquisition_cost', 'current_value', 'is_active')
    list_filter = ('is_active', 'depreciation_method')
    search_fields = ('code', 'name')
    readonly_fields = ('current_value', 'last_depreciation_date')
    actions = ['run_depreciation']

    def run_depreciation(self, request, queryset):
        for asset in queryset:
            entry = asset.post_depreciation()
            if entry:
                self.message_user(request, _("تم إنشاء قيد الإهلاك رقم %s للأصل %s") % (entry.entry_number, asset.name))
            else:
                self.message_user(request, _("لا يوجد إهلاك مستحق للأصل %s") % asset.name, level='warning')
    run_depreciation.short_description = _("تشغيل الإهلاك للأصول المختارة")

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'action', 'model_name', 'object_repr')
    list_filter = ('action', 'model_name', 'timestamp')
    search_fields = ('object_repr', 'changes')
    readonly_fields = ('timestamp', 'user', 'action', 'model_name', 'object_id', 'object_repr', 'changes', 'ip_address')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(CostCenter)
class CostCenterAdmin(admin.ModelAdmin):
    list_display = ('code', 'name')
    search_fields = ('code', 'name')

@admin.register(FinancialPeriod)
class FinancialPeriodAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date', 'end_date', 'is_closed')
    list_filter = ('is_closed',)

class JournalItemInline(admin.TabularInline):
    model = JournalItem
    extra = 2
    autocomplete_fields = ['account', 'cost_center']

@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ('entry_number', 'date', 'description', 'is_posted')
    list_filter = ('is_posted', 'date')
    search_fields = ('entry_number', 'description', 'reference')
    inlines = [JournalItemInline]
    actions = ['post_entries', 'unpost_entries']

    def post_entries(self, request, queryset):
        for entry in queryset:
            try:
                entry.post()
            except ValueError as e:
                self.message_user(request, str(e), level='error')
    post_entries.short_description = _("ترحيل القيود المختارة")

    def unpost_entries(self, request, queryset):
        for entry in queryset:
            try:
                entry.unpost()
            except ValueError as e:
                self.message_user(request, str(e), level='error')
    unpost_entries.short_description = _("إلغاء ترحيل القيود المختارة")

@admin.register(Account)
class AccountAdmin(DraggableMPTTAdmin):
    list_display = ('tree_actions', 'indented_title', 'code', 'account_type', 'is_selectable', 'balance')
    list_display_links = ('indented_title',)
    search_fields = ('name', 'code')
    list_filter = ('account_type', 'is_selectable')
