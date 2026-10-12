import { HttpErrorResponse } from '@angular/common/http';
import { messageApi } from './http';

describe('messageApi', () => {
  it('affiche le motif de chaque champ refusé plutôt que le message générique', () => {
    const erreur = new HttpErrorResponse({
      status: 400,
      error: {
        message: 'Certains champs sont invalides',
        validationErrors: { secretWebhook: 'Secret de webhook invalide (format whsec_…).' },
      },
    });
    expect(messageApi(erreur)).toBe('Secret de webhook invalide (format whsec_…).');
  });

  it('garde le message du serveur sans détail par champ', () => {
    const erreur = new HttpErrorResponse({ status: 409, error: { message: 'Déjà pris' } });
    expect(messageApi(erreur)).toBe('Déjà pris');
  });
});
