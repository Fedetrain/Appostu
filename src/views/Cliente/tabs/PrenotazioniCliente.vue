<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Le tue prenotazioni</ion-title>
        <ion-loading :is-open="isOpenLoading" message="Attendere prego..."></ion-loading>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card v-for="prenotazione in prenotazioni" :key="prenotazione.dataPrenotazione" class="custom-card">
        <ion-card-header>
          <div class="div-title-icon">
            <ion-card-title>{{ prenotazione.nomeNegozio }}</ion-card-title>
            <ion-icon class="trash" :icon="trashOutline" @click="handleDelete(prenotazione)"></ion-icon>
          </div>

          <p class="contact-info"> cell: {{ prenotazione.cellulareNegozio }}</p>
          <p class="contact-info">{{ prenotazione.indirizzoNegozio }},{{ prenotazione.cittaNegozio }}</p>
        </ion-card-header>

        <ion-card-content class="card-content">
          <ion-card-subtitle>{{ formattaData(prenotazione.dataPrenotazione) }}, {{ prenotazione.servizioSelezionato }}</ion-card-subtitle>
          <div class="info-item">
            <p><strong>Durata:</strong> {{ prenotazione.durataServizioSelezionato }} minuti</p>
          </div>
          <div class="info-item">
            <p><strong>Ora inizio:</strong> {{ prenotazione.oraInizio }}</p>
          </div>
          <div class="info-item">
            <p><strong>Ora fine:</strong> {{ prenotazione.oraFine }}</p>
          </div>
          <div class="info-item">
            <p><strong>Commento:</strong> {{ prenotazione.commento }}</p>
          </div>
        </ion-card-content>
      </ion-card>
            <p class="scritta-nessuno" v-show="isPrenotazioniEmpty" >Nessuna prenotazione trovata</p>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  toastController,
  onIonViewDidEnter,
  IonPage,
  IonIcon,
  IonLoading,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  alertController
} from '@ionic/vue';
import {
  getFirestore,
  collection,
  where,
  query,
  getDocs,
  orderBy,
  doc,
  getDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { trashOutline } from 'ionicons/icons';

const auth = getAuth();
const db = getFirestore();

const uid = auth.currentUser?.uid;
console.log("uiddd", uid);

interface Prenotazione {
  idDocumentPrenotazione: string;
  idDocumentNegozio: string;
  servizioSelezionato: string;
  commento: string;
  dataPrenotazione: any;
  durataServizioSelezionato: string;
  oraInizio: string;
  oraFine: string;
  nomeNegozio: string;
  cellulareNegozio?: string;
  cittaNegozio?: string;
  indirizzoNegozio?: string;
}

const prenotazioni = ref<Prenotazione[]>([]);
const isOpenLoading = ref(false); // Stato per gestire l'apertura/chiusura del loading

const formattaData = (timestamp: { toMillis: () => string | number | Date }) => {
  const data = new Date(timestamp.toMillis());
  return `${data.getDate()}/${data.getMonth() + 1}/${data.getFullYear()}`;
};

const isPrenotazioniEmpty = computed(() => prenotazioni.value.length === 0);

async function recuperaInformazioniNegozio(idDocumentNegozio: string): Promise<any | null> {
  try {
    const negoziRef = doc(db, 'Negozi', idDocumentNegozio);
    const querySnapshot = await getDoc(negoziRef);

    if (querySnapshot.exists()) {
      const negozio = querySnapshot.data();
      console.log('Informazioni del negozio recuperate:', negozio); // Aggiungi questo log
      return negozio;
    } else {
      console.error('Nessun documento trovato per il negozio con ID:', idDocumentNegozio);
      return null;
    }
  } catch (error) {
    console.error('Errore durante il recupero del nome del negozio:', error);
    return null;
  }
}

const handleDelete = async (prenotazione: Prenotazione) => {
  console.log('Tentativo di eliminazione della prenotazione:', prenotazione);

  const alert = await alertController.create({
    header: 'Conferma eliminazione',
    message: 'Sei sicuro di voler eliminare questa prenotazione?',
    buttons: [
      {
        text: 'Annulla',
        role: 'cancel',
        cssClass: 'secondary',
        handler: () => {
          console.log('Eliminazione annullata');
        }
      },
      {
        text: 'Elimina',
        handler: async () => {
          const now = new Date();
          console.log('Data e ora attuali:', now);

          const oraInizioPrenotazione = new Date(prenotazione.dataPrenotazione.toMillis());
          oraInizioPrenotazione.setHours(parseInt(prenotazione.oraInizio.split(':')[0]), parseInt(prenotazione.oraInizio.split(':')[1]));
          console.log('Ora di inizio della prenotazione:', oraInizioPrenotazione);

          const diffOre = (oraInizioPrenotazione.getTime() - now.getTime()) / (1000 * 60 * 60);
          console.log('Differenza in ore tra ora attuale e ora di inizio prenotazione:', diffOre);

          if (diffOre > 3) {
            console.log('Differenza maggiore di 3 ore. Procedo con l\'eliminazione.');
            try {
              await deleteDoc(doc(db, 'Prenotazioni', prenotazione.idDocumentPrenotazione));
              presentToast("Prenotazione eliminata con successo");

              console.log('Documento eliminato dal database:', prenotazione.idDocumentNegozio);

              await recuperaPrenotazioni();
            } catch (error) {
              console.error('Errore durante l\'eliminazione della prenotazione dal database:', error);
            }
          } else {
            presentToast("Non è possibile eliminare la prenotazione. Meno di 3 ore all'inizio del servizio.");

            console.log('Non è possibile eliminare la prenotazione. Meno di 3 ore all\'inizio del servizio.');
          }
        }
      }
    ]
  });

  await alert.present();
};

onIonViewDidEnter(async () => {
  isOpenLoading.value = true; // Apre il loading

  if (!uid) {
    console.error('UID non disponibile. L\'utente potrebbe non essere autenticato.');
    isOpenLoading.value = false; // Chiude il loading in caso di errore
    return;
  }

  await recuperaPrenotazioni();
});

async function recuperaPrenotazioni() {
  try {
    console.log('Inizio recupero delle prenotazioni...');

    const now = new Date();
    const nowTimestamp = Timestamp.fromDate(now); // Ottiene la data corrente come timestamp Firestore
    console.log('rimesi delle prenotazioni...', nowTimestamp);

    const prenotazioniRef = collection(db, 'Prenotazioni');
    const q = query(
      prenotazioniRef,
      where('idDocumentCliente', '==', uid),
      where('dataPrenotazione', '>=', nowTimestamp),
      orderBy('dataPrenotazione')
    );

    const snapshot = await getDocs(q);

    prenotazioni.value = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data() as Prenotazione;
      data.idDocumentPrenotazione = doc.id;

      const informazioniNegozio = await recuperaInformazioniNegozio(data.idDocumentNegozio);
      if (informazioniNegozio) {
        data.nomeNegozio = informazioniNegozio.nomeNegozio;
        data.cellulareNegozio = informazioniNegozio.cellulareNegozio;
        data.cittaNegozio = informazioniNegozio.cittaNegozio;
        data.indirizzoNegozio = informazioniNegozio.indirizzoNegozio;
      }

      console.log(`Prenotazione caricata: ${data.idDocumentPrenotazione}`);
      console.log('Dettagli prenotazione:', data); // Aggiungi questo log per visualizzare i dettagli della prenotazione

      return data;
    }));

    console.log('Prenotazioni caricate:', prenotazioni.value);

  } catch (error) {
    console.error('Errore durante il recupero delle prenotazioni:', error);
    presentToast("Errore durante il recupero delle prenotazioni");
  } finally {
    isOpenLoading.value = false; // Chiude il loading una volta completato
    console.log('Recupero delle prenotazioni completato.');
  }
}

async function presentToast(message: string) {
  const toast = await toastController.create({
    message: message,
    duration: 2000,
  });

  await toast.present();
}
</script>




<style scoped>

.scritta-nessuno{
  display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;

}
.custom-card {
  border-radius: 10px;
  box-shadow: 0 4px 8px #e271085e;
}
.trash{
  color: #e27108;
  width: 30px;
  height: 30px;
  float: right;
}

.contact-info {
  display: flex;
  align-items: center;
  margin: 0px;
  font-size: 14px;
  color: black;
}
.info-item {
  display: flex;
  align-items: center;
  color: black;

}
ion-card-title{
  font-size: xx-large;
  color: #e27108;

}

.info-item p {
  margin: 0;
  color: black;

}

.div-title-icon{
  display: flex;
  justify-content: space-between; /* Distribuisce lo spazio in modo uniforme */

}

</style>

