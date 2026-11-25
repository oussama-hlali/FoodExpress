import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

/** Page de profil : mise à jour des coordonnées et du mot de passe. */
@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);

  readonly profileForm = this.fb.nonNullable.group({
    nom: [this.auth.user()?.nom ?? '', Validators.required],
    prenom: [this.auth.user()?.prenom ?? '', Validators.required],
    telephone: [
      this.auth.user()?.telephone ?? '',
      [Validators.required, Validators.pattern(/^[0-9+\s]{8,15}$/)],
    ],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  /** Enregistre les coordonnées et affiche un toast de confirmation. */
  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile.set(true);
    this.auth.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: (res) => {
        this.savingProfile.set(false);
        this.toast.success(res.message);
      },
      error: (err) => {
        this.savingProfile.set(false);
        this.toast.error(err.message || 'Mise à jour impossible.');
      },
    });
  }

  /** Change le mot de passe après vérification de la confirmation. */
  savePassword(): void {
    const values = this.passwordForm.getRawValue();

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    if (values.newPassword !== values.confirmPassword) {
      this.toast.error('Les mots de passe ne correspondent pas.');
      return;
    }

    this.savingPassword.set(true);
    this.auth.changePassword(values).subscribe({
      next: (res) => {
        this.savingPassword.set(false);
        this.toast.success(res.message);
        this.passwordForm.reset();
      },
      error: (err) => {
        this.savingPassword.set(false);
        this.toast.error(err.message || 'Changement de mot de passe impossible.');
      },
    });
  }
}
