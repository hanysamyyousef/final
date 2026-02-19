from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.db.models import Sum, Q
from django.contrib import messages
from .models import Account, JournalEntry, JournalItem, CostCenter
from .forms import AccountForm, JournalEntryForm, JournalItemFormSet
from django.utils import timezone
from datetime import timedelta
from django.utils.translation import gettext_lazy as _

@login_required
def account_list(request):
    """عرض شجرة الحسابات"""
    accounts = Account.objects.all()
    return render(request, 'accounting/accounts/account_list.html', {
        'accounts': accounts,
        'title': _('شجرة الحسابات')
    })

@login_required
def account_create(request):
    """إنشاء حساب جديد"""
    if request.method == 'POST':
        form = AccountForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, _('تم إنشاء الحساب بنجاح.'))
            return redirect('accounting:account_list')
    else:
        form = AccountForm()
    
    return render(request, 'accounting/accounts/account_form.html', {
        'form': form,
        'title': _('إضافة حساب جديد')
    })

@login_required
def account_update(request, pk):
    """تعديل حساب موجود"""
    account = get_object_or_404(Account, pk=pk)
    if request.method == 'POST':
        form = AccountForm(request.POST, instance=account)
        if form.is_valid():
            form.save()
            messages.success(request, _('تم تحديث الحساب بنجاح.'))
            return redirect('accounting:account_list')
    else:
        form = AccountForm(instance=account)
    
    return render(request, 'accounting/accounts/account_form.html', {
        'form': form,
        'title': _('تعديل الحساب')
    })

@login_required
def journal_entry_list(request):
    """عرض القيود المحاسبية"""
    entries = JournalEntry.objects.all().prefetch_related('items')
    
    # فلترة
    query = request.GET.get('q')
    if query:
        entries = entries.filter(
            Q(entry_number__icontains=query) | 
            Q(description__icontains=query) |
            Q(reference__icontains=query)
        )
    
    return render(request, 'accounting/entries/entry_list.html', {
        'entries': entries,
        'title': _('القيود المحاسبية')
    })

@login_required
def journal_entry_create(request):
    """إنشاء قيد جديد مع بنوده"""
    if request.method == 'POST':
        form = JournalEntryForm(request.POST)
        formset = JournalItemFormSet(request.POST)
        
        if form.is_valid() and formset.is_valid():
            entry = form.save()
            formset.instance = entry
            formset.save()
            messages.success(request, _('تم حفظ القيد بنجاح.'))
            return redirect('accounting:journal_entry_detail', pk=entry.pk)
    else:
        # توليد رقم قيد تلقائي
        last_entry = JournalEntry.objects.order_by('-id').first()
        next_num = 1
        if last_entry and last_entry.entry_number.isdigit():
            next_num = int(last_entry.entry_number) + 1
        
        form = JournalEntryForm(initial={'entry_number': str(next_num), 'date': timezone.now()})
        formset = JournalItemFormSet()
    
    return render(request, 'accounting/entries/entry_form.html', {
        'form': form,
        'formset': formset,
        'title': _('إنشاء قيد محاسبي جديد')
    })

@login_required
def journal_entry_detail(request, pk):
    """عرض تفاصيل القيد"""
    entry = get_object_or_404(JournalEntry, pk=pk)
    return render(request, 'accounting/entries/entry_detail.html', {
        'entry': entry,
        'title': _('تفاصيل القيد')
    })

@login_required
def journal_entry_post(request, pk):
    """ترحيل القيد"""
    entry = get_object_or_404(JournalEntry, pk=pk)
    try:
        if entry.post():
            messages.success(request, _('تم ترحيل القيد وتحديث الأرصدة بنجاح.'))
        else:
            messages.warning(request, _('القيد مرحل بالفعل.'))
    except ValueError as e:
        messages.error(request, str(e))
    
    return redirect('accounting:journal_entry_detail', pk=pk)

@login_required
def journal_entry_unpost(request, pk):
    """إلغاء ترحيل القيد"""
    entry = get_object_or_404(JournalEntry, pk=pk)
    try:
        if entry.unpost():
            messages.success(request, _('تم إلغاء الترحيل وعكس الأرصدة بنجاح.'))
        else:
            messages.warning(request, _('القيد غير مرحل.'))
    except ValueError as e:
        messages.error(request, str(e))
    
    return redirect('accounting:journal_entry_detail', pk=pk)

@login_required
def financial_dashboard(request):
    """لوحة مؤشرات الأداء المالي (Financial KPIs Dashboard)"""
    
    # 1. إجمالي الأصول والخصوم
    assets = Account.objects.filter(account_type='asset').aggregate(total=Sum('balance'))['total'] or 0
    liabilities = Account.objects.filter(account_type='liability').aggregate(total=Sum('balance'))['total'] or 0
    equity = Account.objects.filter(account_type='equity').aggregate(total=Sum('balance'))['total'] or 0
    
    # 2. صافي الربح (الإيرادات - المصروفات) لهذا الشهر
    this_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0)
    
    income = JournalItem.objects.filter(
        account__account_type='income',
        journal_entry__date__gte=this_month_start,
        journal_entry__is_posted=True
    ).aggregate(total=Sum('credit'))['total'] or 0
    
    expenses = JournalItem.objects.filter(
        account__account_type='expense',
        journal_entry__date__gte=this_month_start,
        journal_entry__is_posted=True
    ).aggregate(total=Sum('debit'))['total'] or 0
    
    net_profit = income - expenses
    
    # 3. النقدية المتوفرة (حسابات الأصول التي تتبع الخزينة)
    cash_on_hand = Account.objects.filter(
        account_type='asset',
        name__icontains='خزينة'
    ).aggregate(total=Sum('balance'))['total'] or 0
    
    # 4. إجمالي القيمة الضريبية (VAT) - الفرق بين المدين والدائن في حسابات الضرائب
    vat_balance = Account.objects.filter(
        name__icontains='ضريبة'
    ).aggregate(total=Sum('balance'))['total'] or 0

    context = {
        'assets': assets,
        'liabilities': liabilities,
        'equity': equity,
        'net_profit': net_profit,
        'cash_on_hand': cash_on_hand,
        'vat_balance': vat_balance,
        'income': income,
        'expenses': expenses,
        'title': 'لوحة التحكم المالية'
    }
    
    return render(request, 'accounting/dashboard.html', context)

from .reports import AccountingReports
from .utils import ExcelExportUtil
from .models import Account, JournalEntry, JournalItem, CostCenter

@login_required
def trial_balance_view(request):
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    cost_center_id = request.GET.get('cost_center')
    export = request.GET.get('export')
    
    report = AccountingReports.get_trial_balance(start_date, end_date, cost_center_id)
    
    if export == 'excel':
        headers = [_("كود الحساب"), _("اسم الحساب"), _("مدين"), _("دائن"), _("رصيد مدين"), _("رصيد دائن")]
        data = []
        for item in report['data']:
            data.append([
                item['account'].code,
                item['account'].name,
                item['debit'],
                item['credit'],
                item['balance_debit'],
                item['balance_credit']
            ])
        # إضافة المجموع
        data.append(["", _("الإجمالي"), "", "", report['total_debit'], report['total_credit']])
        return ExcelExportUtil.export_report(_("ميزان المراجعة"), headers, data)

    cost_centers = CostCenter.objects.all()
    return render(request, 'accounting/reports/trial_balance.html', {
        'report': report,
        'start_date': start_date,
        'end_date': end_date,
        'cost_center_id': cost_center_id,
        'cost_centers': cost_centers,
        'title': 'ميزان المراجعة'
    })

@login_required
def profit_loss_view(request):
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    cost_center_id = request.GET.get('cost_center')
    export = request.GET.get('export')
    
    report = AccountingReports.get_profit_loss(start_date, end_date, cost_center_id)
    
    if export == 'excel':
        headers = [_("الحساب"), _("المبلغ")]
        data = [[_("الإيرادات"), ""]]
        for item in report['income']:
            data.append([item['account'].name, item['balance']])
        data.append([_("إجمالي الإيرادات"), report['total_income']])
        data.append(["", ""])
        data.append([_("المصروفات"), ""])
        for item in report['expense']:
            data.append([item['account'].name, item['balance']])
        data.append([_("إجمالي المصروفات"), report['total_expense']])
        data.append(["", ""])
        data.append([_("صافي الربح"), report['net_profit']])
        return ExcelExportUtil.export_report(_("قائمة الدخل"), headers, data)

    cost_centers = CostCenter.objects.all()
    return render(request, 'accounting/reports/profit_loss.html', {
        'report': report,
        'start_date': start_date,
        'end_date': end_date,
        'cost_center_id': cost_center_id,
        'cost_centers': cost_centers,
        'title': 'قائمة الدخل'
    })

@login_required
def balance_sheet_view(request):
    date = request.GET.get('date')
    cost_center_id = request.GET.get('cost_center')
    export = request.GET.get('export')
    
    report = AccountingReports.get_balance_sheet(date, cost_center_id)
    
    if export == 'excel':
        headers = [_("الحساب"), _("المبلغ")]
        data = [[_("الأصول"), ""]]
        for item in report['assets']:
            data.append([item['account'].name, item['balance']])
        data.append([_("إجمالي الأصول"), report['total_assets']])
        data.append(["", ""])
        data.append([_("الخصوم"), ""])
        for item in report['liabilities']:
            data.append([item['account'].name, item['balance']])
        data.append([_("إجمالي الخصوم"), report['total_liabilities']])
        data.append(["", ""])
        data.append([_("حقوق الملكية"), ""])
        for item in report['equity']:
            data.append([item['account'].name, item['balance']])
        data.append([_("صافي الربح"), report['net_profit']])
        data.append([_("إجمالي حقوق الملكية"), report['total_equity'] + report['net_profit']])
        data.append(["", ""])
        data.append([_("إجمالي الخصوم وحقوق الملكية"), report['total_liabilities_equity']])
        return ExcelExportUtil.export_report(_("الميزانية العمومية"), headers, data)

    cost_centers = CostCenter.objects.all()
    return render(request, 'accounting/reports/balance_sheet.html', {
        'report': report,
        'date': date,
        'cost_center_id': cost_center_id,
        'cost_centers': cost_centers,
        'title': 'الميزانية العمومية'
    })

@login_required
def vat_report_view(request):
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    report = AccountingReports.get_vat_report(start_date, end_date)
    
    if request.GET.get('export') == 'excel':
        from .utils import ExcelExportUtil
        headers = [_("الحساب"), _("ضريبة المشتريات (مدين)"), _("ضريبة المبيعات (دائن)"), _("الصافي المستحق")]
        data = []
        for row in report['data']:
            data.append([
                row['account'].name,
                row['debit'],
                row['credit'],
                row['net']
            ])
        data.append(["", "", "", ""])
        data.append([
            _("الإجمالي الكلي"),
            report['total_input_vat'],
            report['total_output_vat'],
            report['net_vat_payable']
        ])
        return ExcelExportUtil.export_report(_("تقرير ضريبة القيمة المضافة"), headers, data)

    return render(request, 'accounting/reports/vat_report.html', {
        'report': report,
        'start_date': start_date,
        'end_date': end_date,
        'title': 'تقرير ضريبة القيمة المضافة'
    })

@login_required
def report_center(request):
    """مركز التقارير الموحد"""
    return render(request, 'accounting/reports/report_center.html', {
        'title': 'مركز التقارير المالية'
    })

@login_required
def contact_balances_view(request):
    """عرض تقرير أرصدة العملاء والموردين"""
    contact_type = request.GET.get('contact_type')
    report = AccountingReports.get_contact_balances(contact_type)
    
    return render(request, 'accounting/reports/contact_balances.html', {
        'report': report,
        'contact_type': contact_type,
        'title': 'تقرير أرصدة المديونيات'
    })

@login_required
def sales_purchase_summary_view(request):
    """عرض تقرير ملخص المبيعات والمشتريات"""
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    report = AccountingReports.get_sales_purchase_summary(start_date, end_date)
    
    return render(request, 'accounting/reports/sales_purchase_summary.html', {
        'report': report,
        'start_date': start_date,
        'end_date': end_date,
        'title': 'ملخص المبيعات والمشتريات'
    })
