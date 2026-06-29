from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0005_aicontext_institution_appointment_institution_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='StudentResource',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('saved_at', models.DateTimeField(auto_now_add=True)),
                ('notes', models.TextField(blank=True, null=True)),
                ('resource', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='saved_by_students', to='dashboard.resource')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='saved_resources', to='auth_app.user')),
            ],
            options={
                'ordering': ['-saved_at'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='studentresource',
            unique_together={('student', 'resource')},
        ),
    ]
