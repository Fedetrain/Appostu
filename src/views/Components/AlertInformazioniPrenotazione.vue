<template>
  <ion-modal :is-open="props.isOpen" @close="closeModal()" backdrop-dismiss="true"
             @ionModalWillPresent="onModalWillPresent"
             @ionModalDidPresent="onModalDidPresent"
             @ionModalWillDismiss="onModalWillDismiss"
             @ionModalDidDismiss="onModalDidDismiss">
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Il mio Modal</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal()">close</ion-button>
        </ion-buttons>
        <ion-loading
          :is-open="isOpenLoading"
          message="Please wait...">
        </ion-loading>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card v-if="props.prenotazioneSelected">
        <ion-card-header>
          <ion-card-title class="ion-text-center">Dettagli Prenotazione</ion-card-title>
        </ion-card-header>

        <ion-card-content class="modal-content">
          <!-- Parte superiore del modal -->
          <div class="modal-top">
            <ion-list>
              <ion-item>
                <ion-label class="ion-text-bold">Servizio:</ion-label>
                <ion-text>{{ props.prenotazioneSelected.servizioSelezionato }}</ion-text>
              </ion-item>
              <ion-item>
                <ion-label class="ion-text-bold">Durata:</ion-label>
                <ion-text>{{ props.prenotazioneSelected.durataServizioSelezionato }} minuti</ion-text>
              </ion-item>
              <ion-item>
                <ion-label class="ion-text-bold">Ora Inizio:</ion-label>
                <ion-text>{{ props.prenotazioneSelected.oraInizio }}</ion-text>
              </ion-item>
              <ion-item>
                <ion-label class="ion-text-bold">Ora Fine:</ion-label>
                <ion-text>{{ props.prenotazioneSelected.oraFine }}</ion-text>
              </ion-item>
              <ion-item>
                <ion-label class="ion-text-bold">Commento:</ion-label>
                <ion-text>{{ props.prenotazioneSelected.commento }}</ion-text>
              </ion-item>
            </ion-list>
          </div>

          <!-- Parte inferiore del modal -->
          <div class="modal-bottom" v-if="cliente">
            <ion-list>
              <ion-item>
                <ion-label class="ion-text-bold">Cliente:</ion-label>
                <ion-text>{{ cliente.nome }} {{ cliente.cognome }}</ion-text>
              </ion-item>
              <ion-item>
                <ion-label class="ion-text-bold">Cellulare Cliente:</ion-label>
                <ion-text>{{ cliente.cellulare }}</ion-text>
              </ion-item>
              <ion-item>
                <ion-label class="ion-text-bold">Email Cliene:</ion-label>
                <ion-text>{{ cliente.email }}</ion-text>
              </ion-item>
              <!-- Aggiungi altri campi dell'utente come necessario -->
            </ion-list>
          </div>

          <!-- Icona di eliminazione -->
          <ion-button color="danger" @click="eliminaPrenotazione()">Elimina Prenotazione</ion-button>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { defineProps, defineEmits, ref, watchEffect, onMounted, onUnmounted } from 'vue';
import { getFirestore, doc, getDoc, deleteDoc } from 'firebase/firestore';
import {
  IonModal,
  IonItem,
  IonLabel,
  IonText,
  IonButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonLoading
} from '@ionic/vue';

const props = defineProps(['isOpen', 'prenotazioneSelected']);
const emit = defineEmits(['close-modal','ricarica-orari']);
const db = getFirestore();
const cliente = ref(null);
const isOpenLoading =ref(false)

// Eseguito quando il componente viene montato
onMounted(() => {
  console.log('Modal montato');
});

// Eseguito quando il componente viene smontato
onUnmounted(() => {
  console.log('Modal smontato');
});

// Funzioni per gestire gli eventi del modal
const onModalWillPresent = () => {
  console.log('Modal sta per essere presentato');
};

const onModalDidPresent = () => {
  console.log('Modal è stato presentato');
};

const onModalWillDismiss = () => {
  console.log('Modal sta per essere chiuso');
  closeModal();
};

const onModalDidDismiss = () => {
  console.log('Modal è stato chiuso');
};

watchEffect(() => {
  if (props.prenotazioneSelected) {
    recuperaInformazioniCliente();
  }
});

const recuperaInformazioniCliente = async () => {
  try {
    isOpenLoading.value= true

    const clienteRef = doc(db, 'Cliente', props.prenotazioneSelected.idDocumentCliente);
    const clienteDoc = await getDoc(clienteRef);

    if (clienteDoc.exists()) {
      cliente.value = clienteDoc.data();
      console.log(cliente.value);
    } else {
      cliente.value = null; // Resetta cliente se non esiste
    }

    isOpenLoading= false

  } catch (error) {
    console.error('Errore nel recupero delle informazioni del cliente:', error);
    cliente.value = null; // Gestione dell'errore
    isOpenLoading.value= false
  }
};

const eliminaPrenotazione = async () => {
  try {
    isOpenLoading.value= true
    const prenotazioneRef = doc(db, 'Prenotazioni', props.prenotazioneSelected.id);
    await deleteDoc(prenotazioneRef);
    console.log('Prenotazione eliminata con successo');
    closeModal(); // Chiudi il modal dopo l'eliminazione
    emit('ricarica-orari');
    isOpenLoading.value= false

  } catch (error) {
    console.error('Errore durante l\'eliminazione della prenotazione:', error);
    isOpenLoading.value= false

    // Gestisci l'errore
  }
};

const closeModal = () => {
  emit('close-modal');
};

</script>

<style scoped>
ion-card {
  margin: auto;
}

ion-card-title {
  font-size: 1.5rem;
}

ion-card-content {
  text-align: center;
}

ion-modal {
  --height: 80%;
  --width: 90%;
  --border-radius: 16px;
  --box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

ion-modal::part(backdrop) {
  background: rgba(209, 213, 219);
  opacity: 1;
}

ion-list {
  padding: 0;
}

ion-item {
  --ion-item-background: transparent;
  --ion-item-text: #333;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap-reverse;
}

ion-label.ion-text-bold {
  font-weight: bold;
}

ion-button {
  margin-top: 1rem;
}

.modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modal-top,
.modal-bottom {
  width: 100%;
}
</style>
