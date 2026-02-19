from django import forms
from django.utils.translation import gettext_lazy as _
from .models import Account, JournalEntry, JournalItem, CostCenter
from django.forms import inlineformset_factory

class AccountForm(forms.ModelForm):
    class Meta:
        model = Account
        fields = ['name', 'code', 'account_type', 'parent', 'is_selectable']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('اسم الحساب')}),
            'code': forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('كود الحساب')}),
            'account_type': forms.Select(attrs={'class': 'form-select'}),
            'parent': forms.Select(attrs={'class': 'form-select'}),
            'is_selectable': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }

class JournalEntryForm(forms.ModelForm):
    class Meta:
        model = JournalEntry
        fields = ['entry_number', 'date', 'description', 'reference']
        widgets = {
            'entry_number': forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('رقم القيد')}),
            'date': forms.DateTimeInput(attrs={'class': 'form-control', 'type': 'datetime-local'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 2, 'placeholder': _('الوصف/البيان')}),
            'reference': forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('المرجع')}),
        }

class JournalItemForm(forms.ModelForm):
    class Meta:
        model = JournalItem
        fields = ['account', 'cost_center', 'debit', 'credit', 'memo']
        widgets = {
            'account': forms.Select(attrs={'class': 'form-select select2'}),
            'cost_center': forms.Select(attrs={'class': 'form-select'}),
            'debit': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0'}),
            'credit': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0'}),
            'memo': forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('البيان')}),
        }

JournalItemFormSet = inlineformset_factory(
    JournalEntry, JournalItem,
    form=JournalItemForm,
    extra=2,
    can_delete=True
)
