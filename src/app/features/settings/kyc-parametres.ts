import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { SettingsService } from './settings.service';
import { dateHeure } from '../../core/utils/format';
import { messageApi } from '../../core/auth/http';
import type { ConfigurationKyc, ModifierConfigurationKyc, TestConnexionKyc } from './settings.model';
import { API_ADMIN } from '../../core/api/ressources';
import { ToastService } from '../../core/notifications/toast.service';
import { Icon } from '../../shared/icons/icon';
import { Badge, EtatVide, Squelette } from '../../shared/components/ui';

/**
 * Connexion au service de vérification d'identité (KYC), exigée pour devenir
 * mentor. La clé d'API et le secret de webhook sont créés dans le dashboard
 * du service KYC, puis collés ici : ils sont chiffrés en base et ne sont
 * jamais réaffichés.
 */
/** Format exact d'une clé du service KYC : préfixe de 8 caractères hexadécimaux, secret de 32. */
const FORMAT_CLE_API = /^kyc_(test|live)_[0-9a-f]{8}_[A-Za-z0-9_-]{32}$/;
/** Secret de signature des webhooks, généré par le service KYC (même règle que le serveur). */
const FORMAT_SECRET_WEBHOOK = /^whsec_\S+$/;

@Component({
  selector: 'app-kyc-parametres',
  imports: [FormsModule, Icon, Badge, EtatVide, Squelette],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './kyc-parametres.html',
})
export class KycParametres {
  private readonly api = inject(SettingsService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly dateHeure = dateHeure;

  protected readonly config = httpResource<ConfigurationKyc>(
    () => `${API_ADMIN}/kyc/configuration`,
  );
  protected readonly erreur = computed(() => messageApi(this.config.error()));
  protected readonly enregistrement = signal(false);
  protected readonly test = signal<TestConnexionKyc | null>(null);
  protected readonly testEnCours = signal(false);
  /** À déclarer dans le dashboard KYC, rubrique Webhooks. */
  protected readonly urlWebhook = `${environment.apiUrl}/api/webhooks/kyc`;

  protected modele = {
    actif: false,
    urlApi: '',
    urlPublique: '',
    pays: 'ML',
    cleApi: '',
    secretWebhook: '',
    supprimerSecretWebhook: false,
  };

  constructor() {
    effect(() => {
      if (this.config.hasValue()) this.remplir(this.config.value());
    });
  }

  /**
   * N'envoie que ce qui a changé par rapport à la configuration enregistrée :
   * on peut par exemple ne coller qu'un nouveau secret de webhook.
   */
  protected enregistrer(): void {
    const m = this.modele;
    const avant = this.config.value();
    const changements: ModifierConfigurationKyc = {};

    const urlApi = m.urlApi.trim();
    if (urlApi !== (avant?.urlApi ?? '')) {
      if (!urlApi) {
        this.toast.erreur("L'URL du service est obligatoire.");
        return;
      }
      changements.urlApi = urlApi;
    }
    const urlPublique = m.urlPublique.trim();
    if (urlPublique !== (avant?.urlPublique ?? '')) changements.urlPublique = urlPublique;
    const pays = m.pays.trim().toUpperCase();
    if (pays !== (avant?.pays ?? '')) changements.pays = pays;
    if (m.actif !== (avant?.actif ?? false)) changements.actif = m.actif;

    const cle = m.cleApi.trim();
    if (cle) {
      if (!FORMAT_CLE_API.test(cle)) {
        this.toast.erreur(
          `Clé d'API invalide : elle doit faire 50 caractères (ici ${cle.length}). ` +
            'Vérifiez qu’elle n’a pas été collée deux fois ou tronquée.',
        );
        return;
      }
      changements.cleApi = cle;
    }
    if (m.supprimerSecretWebhook) changements.supprimerSecretWebhook = true;
    else if (m.secretWebhook.trim()) {
      const secret = m.secretWebhook.trim();
      if (!FORMAT_SECRET_WEBHOOK.test(secret)) {
        this.toast.erreur(
          'Secret de webhook invalide : il commence par « whsec_ ». Copiez celui affiché par le ' +
            'service KYC à la création du webhook (ou après « Renouveler le secret »).',
        );
        return;
      }
      changements.secretWebhook = secret;
    }

    if (!Object.keys(changements).length) {
      this.toast.info('Aucune modification à enregistrer.');
      return;
    }
    if (m.actif && !cle && !avant?.cleApiDefinie) {
      this.toast.erreur("Renseignez la clé d'API avant d'activer la vérification.");
      return;
    }
    this.enregistrement.set(true);
    this.api.enregistrerConfigurationKyc(changements).subscribe({
      next: (c) => {
        this.enregistrement.set(false);
        this.config.value.set(c);
        this.test.set(null);
        this.toast.succes('Configuration de la vérification d’identité enregistrée.');
      },
      error: (e) => {
        this.enregistrement.set(false);
        this.toast.erreur(messageApi(e));
      },
    });
  }

  protected tester(): void {
    this.testEnCours.set(true);
    this.api.testerConnexionKyc().subscribe({
      next: (r) => {
        this.testEnCours.set(false);
        this.test.set(r);
      },
      error: (e) => {
        this.testEnCours.set(false);
        this.toast.erreur(messageApi(e));
      },
    });
  }

  protected async copierUrlWebhook(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.urlWebhook);
      this.toast.succes('Adresse copiée.');
    } catch {
      this.toast.erreur('Copie impossible : sélectionnez l’adresse à la main.');
    }
  }

  /** Les champs secrets restent vides : les laisser vides conserve la valeur enregistrée. */
  private remplir(c: ConfigurationKyc): void {
    this.modele = {
      actif: c.actif,
      urlApi: c.urlApi ?? '',
      urlPublique: c.urlPublique ?? '',
      pays: c.pays || 'ML',
      cleApi: '',
      secretWebhook: '',
      supprimerSecretWebhook: false,
    };
    // modele n'est pas un signal : sans cela, le préremplissage n'apparaît pas (OnPush, sans zone).
    this.cdr.markForCheck();
  }
}
