from django.utils.text import slugify
from rest_framework.decorators import api_view
from rest_framework.decorators import permission_classes
from auth_app.models import User
from auth_app.models import Institution
from rest_framework.response import Response 
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from dashboard.serializers import InstitutionSerializer


def resolve_institution(payload):
    institution_id = payload.get("institution_id") or payload.get("institution")
    institution_slug = payload.get("institution_slug")

    if institution_id:
        return Institution.objects.filter(id=institution_id, is_active=True).first()
    if institution_slug:
        return Institution.objects.filter(slug=institution_slug, is_active=True).first()

    active_institutions = Institution.objects.filter(is_active=True).order_by("name")
    if active_institutions.count() == 1:
        return active_institutions.first()
    return None


@api_view(["GET"])
@permission_classes([AllowAny])
def institutions_view(request):
    institutions = Institution.objects.filter(is_active=True).order_by("name")
    return Response(InstitutionSerializer(institutions, many=True).data)


# Create your views here.
@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    role = request.data.get("role", User.Role.STUDENT)
    institution = resolve_institution(request.data)

    if role not in {User.Role.STUDENT, User.Role.COUNSELLOR}:
        return Response({'message': 'Invalid role'}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({'message': 'User already exists'}, status = 409)
    
    if  not email or not password:
       return  Response( {'message': 'Email and password are required'}, status=400)

    if institution is None:
        return Response(
            {'message': 'Select a valid institution before creating an account'},
            status=400,
        )
    
    user = User.objects.create_user(email=email, password=password, role=role, institution=institution)
    return Response({
        'message': 'User created successfully',
        'role': role,
        'institution': InstitutionSerializer(institution).data,
        'email': user.email,
    }, status=201)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    if not email or not password:
        return Response({'message': 'Email and password are required'}, status=400)
    
    try:
        user = User.objects.get(email=email)
        if user.check_password(password):
            refresh = RefreshToken.for_user(user)
            refresh["role"] = user.role
            if user.institution_id:
                refresh["institution_id"] = user.institution_id
            
            response = Response({
                'message': 'Login Successful',
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "role": user.role,
                "email": user.email,
                "institution": InstitutionSerializer(user.institution).data if user.institution_id else None,
            }, status=200)
            
            response.set_cookie(
                'refreshToken',
                str(refresh),
                httponly=True,
                secure=settings.AUTH_COOKIE_SECURE,
                samesite=settings.AUTH_COOKIE_SAMESITE
            )
            response.set_cookie(
                'accessToken',
                str(refresh.access_token),
                httponly=True,
                secure=settings.AUTH_COOKIE_SECURE,
                samesite=settings.AUTH_COOKIE_SAMESITE
            )
            
            user.is_active = True
            user.save()
            return response
        
        else:
            return Response({'message': 'Invalid Password'}, status=400)
    
    except User.DoesNotExist:
        return Response({'message': f'No user with {email} found'}, status=404)
    
@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def logout(request):
    response = Response({'message': 'Logged out successfully'})
    response.delete_cookie('refreshToken', samesite=settings.AUTH_COOKIE_SAMESITE)
    response.delete_cookie('accessToken', samesite=settings.AUTH_COOKIE_SAMESITE)
    
    return response

@api_view(["POST"])
def auth(request):
    return Response({
        'email': request.user.email,
        'role': request.user.role,
        'institution': InstitutionSerializer(request.user.institution).data if request.user.institution_id else None,
    })
