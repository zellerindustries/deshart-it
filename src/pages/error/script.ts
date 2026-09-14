interface ErrorDetail {
  readonly title: string;
  readonly description: string;
}

// 1. Mappa statica riutilizzabile e congelata in memoria per evitare allocazioni inutili
const ERROR_MAP: Readonly<Record<string, ErrorDetail>> = Object.freeze({
  '400': {
    title: 'Richiesta non valida',
    description: 'La richiesta non è corretta o non può essere elaborata dal server.',
  },
  '401': {
    title: 'Non autorizzato',
    description: 'È necessario accedere per visualizzare questa pagina.',
  },
  '403': {
    title: 'Accesso negato',
    description: 'Non disponi dei permessi per accedere a questa risorsa.',
  },
  '404': {
    title: 'Pagina non trovata',
    description: "La pagina richiesta non esiste, è stata rimossa o l'indirizzo non è corretto.",
  },
  '408': {
    title: 'Tempo di attesa scaduto',
    description: 'La connessione ha impiopato troppo tempo. Riprova a caricare la pagina.',
  },
  '429': {
    title: 'Troppe richieste',
    description: 'Hai inviato troppe richieste in poco tempo. Attendi qualche istante e riprova.',
  },
  '500': {
    title: 'Errore del server',
    description:
      'Si è verificato un problema momentaneo sui nostri sistemi. Stiamo lavorando per risolverlo, riprova più tardi.',
  },
});

const DEFAULT_CODE = '404';

// 2. Esecuzione immediata ed efficiente
(() => {
  'use strict';

  // O(1) parsing veloce del parametro "code" dal query string senza instanziare URL intero
  const search = window.location.search;
  const match = search.match(/[?&]code=([^&]*)/);
  const rawCode = match ? match[1] : null;

  // Risoluzione rapida del codice
  let activeCode = DEFAULT_CODE;

  if (rawCode) {
    if (rawCode.charCodeAt(0) === 53) {
      // 53 è il codice ASCII per il carattere '5' (più veloce di .startsWith)
      activeCode = '500';
    } else if (Object.prototype.hasOwnProperty.call(ERROR_MAP, rawCode)) {
      activeCode = rawCode;
    }
  }

  const errorData = ERROR_MAP[activeCode];

  // 3. Batching delle interrogazioni DOM in un'unica operazione
  const codeElement = document.getElementById('code-text');
  const codeWrapper = document.getElementById('error-code');
  const headingElement = document.getElementById('heading');
  const descriptionElement = document.getElementById('description');

  // Aggiornamento batch delle proprietà dei nodi DOM
  if (codeElement) codeElement.textContent = activeCode;
  if (headingElement) headingElement.textContent = errorData.title;
  if (descriptionElement) descriptionElement.textContent = errorData.description;
  if (codeWrapper) codeWrapper.setAttribute('aria-label', `Errore ${activeCode}`);

  // Impostazione del titolo documento senza dover fare il refind dell'elemento <title>
  document.title = `${activeCode} - ${errorData.title}`;
})();
