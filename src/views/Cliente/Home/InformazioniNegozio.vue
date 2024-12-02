<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary"  >
        <BackButton></BackButton>
        <ion-loading :is-open="isOpenLoading" message="Please wait..."></ion-loading>
      </ion-toolbar>
    </ion-header>

    <ion-content >
      <div class="div-store-image">
        <img class="store-image" alt="Silhouette of mountains" :src="imageUrl" />
      </div>

      <div class="div-contenuto">
        <h1 class="store-name">{{ document.nomeNegozio }}</h1>
        <p class="store-address">{{ document.indirizzoNegozio + ", " + document.cittaNegozio }}</p>

        <div class="div-phone">
          <ion-icon :icon="callOutline" size="large" class="phone-icon"></ion-icon>
          <p class="phone-number">{{ document.cellulareNegozio }}</p>
        </div>

        <hr class="divider">

        <div class="div-description">
          <p class="description-label">Descrizione:</p>
          <p class="store-description">{{ document.descrizioneNegozio }}</p>
        </div>

        <div class="div-calendar">
          <ion-datetime v-if="!isOpenLoading"
          @ionChange="gestisciCambioData" 
          presentation="date" 
          :show-default-buttons="true" 
          done-text="Vedi Appuntamenti" 
          cancel-text="" 
          class="calendar-picker"
          :is-date-enabled="isDateEnabled"
          locale="it-IT"
          ></ion-datetime>
        </div>
      </div>
    </ion-content>

    <div style="background-color: transparent;">
      <div class="div-scelta-servizio" id="present-alert" @click="apriModal">
        <p class="clicca-per-cambiare-servizio">Clicca per cambiare servizio</p>
        <p>{{ servizioSelezionato.nome }}</p>
      </div>
    </div>

    <ion-modal :is-open="modalIsOpen" @ionModalDidDismiss="modalIsOpen = false">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title class="custom-title">Seleziona un Servizio</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="chiudiModal" class="custom-button">chiudi</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding custom-content">
        <ion-list class="custom-list">
          <ion-item v-for="servizio in setServizi" :key="servizio" @click="selezionaServizio(servizio)" class="custom-item">
            <ion-label class="custom-label">
              <h2>{{ servizio.nome }}</h2>
              <p>Durata: {{ servizio.durata }} min</p>
              <p>Costo: €{{ servizio.costo }}</p>
            </ion-label>
          </ion-item>
          <div class="scritta-vuoto">
            <h2 v-if="setServizi.size ===0" >Il gestore non ha ancora selezionato nessun servizio</h2>
          </div>
        </ion-list>
      </ion-content>
    </ion-modal>

    <IonPopover
      :is-open="isPopoverOpen"
      @ionPopoverDidDismiss="isPopoverOpen = false"
    >
      <p style="padding: 1rem; color: red;">Negozio chiuso questo giorno</p>
    </IonPopover>
  </ion-page>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { IonIcon } from '@ionic/vue';
import { callOutline } from 'ionicons/icons';
import { getFirestore, collection, getDoc, doc, query, getDocs } from 'firebase/firestore';
import { IonPopover,IonLoading,toastController, IonButton,IonButtons,IonLabel, IonModal, IonList, IonItem, IonPage, IonBackButton, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonDatetime } from '@ionic/vue';
import { useRouter } from 'vue-router';
import BackButton from '/src/views/Components/BackButton.vue';

const router = useRouter();

const store = useStore();
const db = getFirestore();
const document = ref({});
const timeZone = 'Europe/Rome';
const opzioniDataOra = { timeZone, hour12: false };
const IdDocumentNegozioSelezionato = store.getters.getIdDocumentNegozioSelezionato;
const isOpenLoading=ref(false);
const isPopoverOpen=ref(false)


const imageUrl = ref(store.getters.getUrlNegozioSelezionato);
const setServizi = ref('');
const modalIsOpen = ref(false);
const servizioSelezionato = ref('');

const highlightDates = ref([]);  // Array per evidenziare le date di ferie
const ferie = ref([]);





const isDateEnabled = (date) => {

  const isEnabled = !ferie.value.includes(date);
  
  return isEnabled;
};


    const recuperaFerie = async () => {
      try {
        console.log('Inizio recupero delle ferie');
        
        // Riferimento alla collezione delle ferie nel negozio selezionato
        const collezioneInternaRef = collection(db, 'Negozi', IdDocumentNegozioSelezionato, 'Ferie');
        const q = query(collezioneInternaRef);
        
        console.log('Query impostata correttamente, avvio il recupero dei documenti');
        
        const querySnapshot = await getDocs(q);
        const ferieTemp = [];
        
        console.log(`Numero di documenti trovati: ${querySnapshot.size}`);
        
        querySnapshot.forEach((doc) => {
          const datiDocumento = doc.data();
          console.log('Documento trovato:', datiDocumento);
          
          if (datiDocumento.timestamp) {
            // Estrai seconds e nanoseconds
            const seconds = datiDocumento.timestamp.seconds;
            const nanoseconds = datiDocumento.timestamp.nanoseconds;
            
            // Calcola i millisecondi totali e crea un oggetto Date
            const milliseconds = (seconds * 1000) + Math.floor(nanoseconds / 1000000);
            const dateFerie = new Date(milliseconds);
            dateFerie.setDate(dateFerie.getDate() + 1);

            
            // Aggiungi la data all'array ferieTemp in formato "YYYY-MM-DD"
            ferieTemp.push(dateFerie.toISOString().split('T')[0]);
            
            console.log(`Data ferie convertita e aggiunta: ${dateFerie}`);
          } else {
            console.log('Il documento non contiene il campo "timestamp"');
          }
        });

        // Aggiorna le date di ferie
        ferie.value = ferieTemp;

        console.log('Ferie aggiornate:', ferie.value);

      } catch (error) {
        console.error('Errore durante il recupero dei documenti interni:', error);
      }
    };


const apriModal = () => {
  modalIsOpen.value = true;
};

const chiudiModal = () => {
  modalIsOpen.value = false;
};

const selezionaServizio = (servizio) => {
  console.log("Valore iniziale di servizioSelezionato:", servizioSelezionato.value);
  servizioSelezionato.value = servizio;
  console.log("Valore di servizioSelezionato dopo l'assegnazione:", servizioSelezionato.value);

  // Chiudi il modal
  chiudiModal();
};



const recuperaInformazioniNegozio = async () => {
  const dataOggi = new Date();
  dataOggi.setHours(0, 0, 0, 0); // Azzera l'orario per confrontare solo le date
  store.dispatch('setDataNegozioSelezionato', dataOggi);
  
  try {
    console.log(IdDocumentNegozioSelezionato);
    const docRef = doc(db, "Negozi", IdDocumentNegozioSelezionato);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      document.value = data; // Presumo che `document` sia un ref o una variabile reattiva
      console.log(data);

      // Imposta il nomeNegozio nello store
      store.dispatch('setNomeNegozio', data.nomeNegozio); // Supponendo che `nomeNegozio` sia una proprietà del documento
    } else {
      console.log("Nessun documento trovato con l'ID specificato");
    }
  } catch (error) {
    console.error('Errore durante il recupero dei negozi:', error.message);
  }
};


const recuperaServizi = async () => {
  const setServiziCopy = new Set();
  try {
    const collezioneInternaRef = collection(db, 'Negozi', IdDocumentNegozioSelezionato, 'Servizi');
    const q = query(collezioneInternaRef);

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const datiDocumento = doc.data();
      setServiziCopy.add(datiDocumento);
    });

    setServizi.value = setServiziCopy;

  } catch (error) {
    console.error('Errore durante il recupero dei documenti interni:', error);
  }
};

const gestisciCambioData = (event) => {
  const nuovaData = new Date(event.detail.value);
  nuovaData.setHours(0, 0, 0, 0);

  const dataOggi = new Date();
  dataOggi.setHours(0, 0, 0, 0);

  if (nuovaData < dataOggi) {
    mostraToast('Non puoi selezionare una data passata.');
    return;
  }
  if (isNaN(nuovaData)) {
    mostraToast('Seleziona una data');
    return;
  }

  if (Object.keys(servizioSelezionato.value).length === 0) {
    apriModal();
  } else {
    store.dispatch('setDataNegozioSelezionato', nuovaData);
    store.dispatch('setServizioSelezionato', servizioSelezionato.value.nome);
    store.dispatch('setDurataServizioSelezionato', servizioSelezionato.value.durata);

    router.push('/cliente/tabs/tab1/informazioniNegozio/visualizzaOrari');
  }
};


async function mostraToast(message) {
  const toast = await toastController.create({
    message: message,
    duration: 2000,
  });
  await toast.present();
};

onMounted( async () => {
  isOpenLoading.value = true;
  await recuperaInformazioniNegozio();
  await recuperaServizi();
  await recuperaFerie();
  isOpenLoading.value = false;

});

</script>


<style scoped>
.custom-label p {
  font-size: medium;
}
.custom-label h2 {
  font-size: larger;
}
.scritta-vuoto{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}


ion-modal {
  --height: 90%;
  --width: 90%;
  --border-radius: 16px;
  --box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.div-store-image {
  /* Centro la div che contiene l'immagine all'interno del genitore */
  display: flex;
  justify-content: center;
  align-items: center;
  /* Aggiungo padding per evitare che l'immagine tocchi i bordi */
  padding: 10px;
  /* Mantengo le proporzioni della div */
  aspect-ratio: 16/9;
  /* Massimizzo l'utilizzo dello spazio disponibile */
  width: 100%;
  max-width: 100%;
  /* Sfondo per eventuali caricamenti o errori */
  border-radius: 12px; /* Arrotondo i bordi della div */
  overflow: hidden; /* Nascondo l'overflow per mantenere il layout pulito */
}

/* Immagine */
.store-image {
  /* La rendo responsive adattandosi alla dimensione del genitore */
  width: 100%;
  height: 100%;
  /* Mantengo le proporzioni dell'immagine */
  object-fit: cover;
  /* Arrotondo i bordi dell'immagine */
  border-radius: 12px;
  /* Aggiungo un'ombra per dare profondità */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  /* Aggiungo una transizione per gli effetti hover */
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}

.div-contenuto {
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin: 16px;
}

.store-name {
  font-size: 2.5em;
  font-weight: bold;
  margin: 8px 0;
  text-align: center;
}

.store-address {
  font-size: 1em;
  color: #555;
  text-align: center;
  margin: 8px 0;
}

.div-phone {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16px 0;
}

.phone-icon {
  margin-right: 8px;
  color: var(--ion-color-secondary);
}

.phone-number {
  font-size: 1em;
  color: #555;
}

.divider {
  border: none;
  height: 1px;
  background-color: var(--ion-color-secondary);
  margin: 16px 0;
}

.div-description {
  margin: 16px 0;
  padding: 3px;
}

.description-label {
  font-weight: bold;
}

.store-description {
  font-size: em;
}

.div-calendar {
  margin: 16px 0;
  display: flex;
  justify-content: center;
}

.calendar-picker {
  width: 100%;
  max-width: 400px;
  border-radius: 10px; /* Angoli arrotondati per un look moderno */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* Ombra sottile per profondità */
  overflow: hidden;
  transition: all 0.3s ease-in-out; /* Transizione fluida */
}
.div-scelta-servizio {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background-color:#e27108;
  cursor: pointer;
  border-top-left-radius: 10%;
  border-top-right-radius: 10%;
  max-height: 90px;
  min-height: 60px;
  margin: 0;
  font-size: 1em;
  text-align: center;
}

.div-scelta-servizio p {
  margin: 0;
  font-size: 1em;
  text-align: center;

}
.clicca-per-cambiare-servizio {
  font-weight: bold;
}

/* Media queries per rendere il design responsivo */
@media (min-width: 768px) {
  .div-store-image {
    height: 400px;
  }

  .store-name {
    font-size: 2em;
  }

  .store-address {
    font-size: 1.2em;
  }

  .phone-number {
    font-size: 1.2em;
  }

  .store-description {
    font-size: 1.2em;
  }
}

@media (min-width: 1024px) {
  .div-store-image {
    height: 450px;

  }

  .div-contenuto {
    max-width: 800px;
    margin: 0 auto;
  }

  .calendar-picker {
    max-width: 500px;
  }
}
</style>

