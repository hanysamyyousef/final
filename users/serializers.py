from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, CustomRole
from rolepermissions.roles import get_user_roles, assign_role, remove_role

class CustomRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomRole
        fields = '__all__'

class ProfileSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display_name', read_only=True)

    class Meta:
        model = Profile
        fields = ['avatar', 'phone', 'address', 'role', 'role_display', 'email_notifications', 'browser_notifications']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'date_joined', 'profile', 'password']
        extra_kwargs = {'password': {'write_only': True}}
        read_only_fields = ['date_joined']

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        
        # Profile is usually created by middleware/signal, but let's ensure it has the data
        profile, created = Profile.objects.get_or_create(user=user)
        role = profile_data.get('role', 'employee')
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()
        
        # Assign role in django-role-permissions
        assign_role(user, role)
        
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        instance.save()
        
        profile = instance.profile
        new_role = profile_data.get('role')
        
        if new_role and new_role != profile.role:
            # Update django-role-permissions
            for role in get_user_roles(instance):
                remove_role(instance, role)
            assign_role(instance, new_role)
            
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()
        
        return instance
