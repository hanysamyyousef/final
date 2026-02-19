from django import template

register = template.Library()

@register.filter
def sum_debit(items):
    return sum(item.debit for item in items)

@register.filter
def sum_credit(items):
    return sum(item.credit for item in items)

@register.filter
def abs_filter(value):
    """إرجاع القيمة المطلقة (Absolute Value)"""
    try:
        return abs(value)
    except (TypeError, ValueError):
        return value

# تسجيل الفلتر باسم abs أيضاً لسهولة الاستخدام
register.filter('abs', abs_filter)
