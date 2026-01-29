from django.db.models import Sum, Q
from .models import Account, JournalItem, JournalEntry
from django.utils import timezone
from decimal import Decimal

class AccountingReports:
    """محرك التقارير المحاسبية"""

    @staticmethod
    def get_trial_balance(start_date=None, end_date=None, cost_center_id=None):
        """تقرير ميزان المراجعة"""
        accounts = Account.objects.all().order_by('code')
        report_data = []
        
        total_debit_balance = Decimal('0.00')
        total_credit_balance = Decimal('0.00')

        for account in accounts:
            # فلترة حركات القيد حسب التاريخ والمركز التكلفة
            items = JournalItem.objects.filter(account=account, journal_entry__is_posted=True)
            if start_date:
                items = items.filter(journal_entry__date__gte=start_date)
            if end_date:
                items = items.filter(journal_entry__date__lte=end_date)
            if cost_center_id:
                items = items.filter(cost_center_id=cost_center_id)

            aggregates = items.aggregate(
                total_debit=Sum('debit'),
                total_credit=Sum('credit')
            )

            debit = aggregates['total_debit'] or Decimal('0.00')
            credit = aggregates['total_credit'] or Decimal('0.00')

            # حساب الرصيد النهائي للميزان
            balance_debit = Decimal('0.00')
            balance_credit = Decimal('0.00')

            if account.account_type in ['asset', 'expense']:
                net = debit - credit
                if net >= 0:
                    balance_debit = net
                else:
                    balance_credit = abs(net)
            else:
                net = credit - debit
                if net >= 0:
                    balance_credit = net
                else:
                    balance_debit = abs(net)

            if debit > 0 or credit > 0 or balance_debit > 0 or balance_credit > 0:
                report_data.append({
                    'account': account,
                    'debit': debit,
                    'credit': credit,
                    'balance_debit': balance_debit,
                    'balance_credit': balance_credit,
                })
                total_debit_balance += balance_debit
                total_credit_balance += balance_credit

        return {
            'data': report_data,
            'total_debit': total_debit_balance,
            'total_credit': total_credit_balance,
            'is_balanced': total_debit_balance == total_credit_balance
        }

    @staticmethod
    def get_profit_loss(start_date=None, end_date=None, cost_center_id=None):
        """تقرير قائمة الدخل"""
        income_accounts = Account.objects.filter(account_type='income')
        expense_accounts = Account.objects.filter(account_type='expense')
        
        report_income = []
        report_expense = []
        
        total_income = Decimal('0.00')
        total_expense = Decimal('0.00')

        # حساب الإيرادات
        for acc in income_accounts:
            items = JournalItem.objects.filter(account=acc, journal_entry__is_posted=True)
            if start_date:
                items = items.filter(journal_entry__date__gte=start_date)
            if end_date:
                items = items.filter(journal_entry__date__lte=end_date)
            if cost_center_id:
                items = items.filter(cost_center_id=cost_center_id)
            
            balance = items.aggregate(
                net=Sum('credit') - Sum('debit')
            )['net'] or Decimal('0.00')
            
            if balance != 0:
                report_income.append({'account': acc, 'balance': balance})
                total_income += balance

        # حساب المصروفات
        for acc in expense_accounts:
            items = JournalItem.objects.filter(account=acc, journal_entry__is_posted=True)
            if start_date:
                items = items.filter(journal_entry__date__gte=start_date)
            if end_date:
                items = items.filter(journal_entry__date__lte=end_date)
            if cost_center_id:
                items = items.filter(cost_center_id=cost_center_id)
            
            balance = items.aggregate(
                net=Sum('debit') - Sum('credit')
            )['net'] or Decimal('0.00')
            
            if balance != 0:
                report_expense.append({'account': acc, 'balance': balance})
                total_expense += balance

        net_profit = total_income - total_expense

        return {
            'income': report_income,
            'expense': report_expense,
            'total_income': total_income,
            'total_expense': total_expense,
            'net_profit': net_profit
        }

    @staticmethod
    def get_balance_sheet(date=None, cost_center_id=None):
        """تقرير الميزانية العمومية"""
        if not date:
            date = timezone.now()

        assets = Account.objects.filter(account_type='asset')
        liabilities = Account.objects.filter(account_type='liability')
        equity = Account.objects.filter(account_type='equity')

        def get_acc_balance(accounts, as_of_date, cc_id):
            data = []
            total = Decimal('0.00')
            for acc in accounts:
                items = JournalItem.objects.filter(account=acc, journal_entry__is_posted=True, journal_entry__date__lte=as_of_date)
                if cc_id:
                    items = items.filter(cost_center_id=cc_id)
                
                if acc.account_type in ['asset', 'expense']:
                    balance = items.aggregate(net=Sum('debit') - Sum('credit'))['net'] or Decimal('0.00')
                else:
                    balance = items.aggregate(net=Sum('credit') - Sum('debit'))['net'] or Decimal('0.00')
                
                if balance != 0:
                    data.append({'account': acc, 'balance': balance})
                    total += balance
            return data, total

        assets_data, total_assets = get_acc_balance(assets, date, cost_center_id)
        liabilities_data, total_liabilities = get_acc_balance(liabilities, date, cost_center_id)
        equity_data, total_equity = get_acc_balance(equity, date, cost_center_id)

        # إضافة صافي الربح للفترة إلى حقوق الملكية
        pl = AccountingReports.get_profit_loss(end_date=date, cost_center_id=cost_center_id)
        net_profit = pl['net_profit']
        
        total_liabilities_equity = total_liabilities + total_equity + net_profit

        return {
            'assets': assets_data,
            'total_assets': total_assets,
            'liabilities': liabilities_data,
            'total_liabilities': total_liabilities,
            'equity': equity_data,
            'total_equity': total_equity,
            'net_profit': net_profit,
            'total_liabilities_equity': total_liabilities_equity,
            'is_balanced': total_assets == total_liabilities_equity
        }

    @staticmethod
    def get_vat_report(start_date=None, end_date=None):
        """تقرير ضريبة القيمة المضافة"""
        from core.models import SystemSettings
        settings = SystemSettings.get_settings()
        
        input_acc = settings.vat_input_account
        output_acc = settings.vat_output_account
        
        report_data = []
        total_input_vat = Decimal('0.00')  # ضريبة المشتريات (مدين عادة)
        total_output_vat = Decimal('0.00') # ضريبة المبيعات (دائن عادة)

        # دالة مساعدة لحساب بيانات الحساب
        def get_account_vat_data(acc, label):
            if not acc:
                return None
            items = JournalItem.objects.filter(account=acc, journal_entry__is_posted=True)
            if start_date:
                items = items.filter(journal_entry__date__gte=start_date)
            if end_date:
                items = items.filter(journal_entry__date__lte=end_date)
            
            aggregates = items.aggregate(
                debit=Sum('debit'),
                credit=Sum('credit')
            )
            
            debit = aggregates['debit'] or Decimal('0.00')
            credit = aggregates['credit'] or Decimal('0.00')
            
            if debit > 0 or credit > 0:
                return {
                    'account': acc,
                    'label': label,
                    'debit': debit,
                    'credit': credit,
                    'net': credit - debit
                }
            return None

        # ضريبة المدخلات
        input_data = get_account_vat_data(input_acc, _("ضريبة المدخلات"))
        if input_data:
            report_data.append(input_data)
            total_input_vat = input_data['debit'] - input_data['credit']

        # ضريبة المخرجات
        output_data = get_account_vat_data(output_acc, _("ضريبة المخرجات"))
        if output_data:
            report_data.append(output_data)
            total_output_vat = output_data['credit'] - output_data['debit']

        # البحث عن أي حسابات ضريبة أخرى لم يتم شمولها
        excluded_ids = []
        if input_acc: excluded_ids.append(input_acc.id)
        if output_acc: excluded_ids.append(output_acc.id)
        
        other_vat_accounts = Account.objects.filter(
            Q(name__icontains='ضريبة') | Q(name__icontains='VAT') | Q(code__startswith='22')
        ).exclude(id__in=excluded_ids)
        
        for acc in other_vat_accounts:
            data = get_account_vat_data(acc, acc.name)
            if data:
                report_data.append(data)
                # إذا كان الحساب ضمن الخصوم (دائن عادة) فهو مخرجات، وإذا كان أصول (مدين عادة) فهو مدخلات
                if acc.account_type == 'asset':
                    total_input_vat += data['debit'] - data['credit']
                else:
                    total_output_vat += data['credit'] - data['debit']

        net_vat_payable = total_output_vat - total_input_vat

        return {
            'data': report_data,
            'total_input_vat': total_input_vat,
            'total_output_vat': total_output_vat,
            'net_vat_payable': net_vat_payable
        }
