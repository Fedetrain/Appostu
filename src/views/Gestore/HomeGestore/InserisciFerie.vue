<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Gestione Ferie</ion-title>
        <BackButton></BackButton>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding content-background">
      <div class="div">
        <ion-item class="date-item">
          <ion-label position="stacked">Seleziona la data di ferie</ion-label>
          <ion-datetime
            display-format="DD-MM-YYYY"
            class="date-picker"
            v-model="selectedDate"
          ></ion-datetime>
        </ion-item>
        <ion-button expand="block" @click="saveVacation" class="submit-button">
          Salva Ferie
        </ion-button>
        <div v-if="message" class="success-message">{{ message }}</div>
      </div>
       <h2>Giorni di Ferie Salvati:</h2>
        <ion-list>
          <ion-item v-for="(vacation, index) in vacationDays" :key="vacation.id">
            <ion-label>{{ formatDate(vacation.date) }}</ion-label>
            <ion-button color="danger" @click="deleteVacation(vacation.id)">Elimina</ion-button>
          </ion-item>
        </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonDatetime,
  IonList
} from '@ionic/vue';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore'; // Importa serverTimestamp
import BackButton from '@/views/Components/BackButton.vue';
import { useStore } from 'vuex';

const db = getFirestore();
const store = useStore();

const selectedDate = ref();
const message = ref<string | null>(null);
const vacationDays = ref<{ id: string; date: string }[]>([]); // Array to hold vacation days

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long', // Full weekday name
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  // Format date to "Mercoledì 02-11-2024"
  return date.toLocaleDateString('it-IT', options).replace(',', '').replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$1-$2-$3');
};

const saveVacation = async () => {
  if (!selectedDate.value) {
    message.value = 'Per favore, seleziona una data.';
    return;
  }

  const storeId = store.getters.getIdDocumentNegozioGestore; // Get the store ID from Vuex store
  if (!storeId) {
    message.value = 'Store ID non trovato.';
    return;
  }

  try {
    // Crea un oggetto Date dalla data selezionata
    const dataSelezionata = new Date(selectedDate.value);
    dataSelezionata.setHours(0)
    dataSelezionata.setMilliseconds(0)
    dataSelezionata.setMinutes(0)
    dataSelezionata.setSeconds(0)
    
    // Crea un timestamp da quell'oggetto Date
    const timestamp = Timestamp.fromDate(dataSelezionata);


    await addDoc(collection(db, "Negozi", storeId, "Ferie"), {
      date: selectedDate.value,
      timestamp: timestamp // Aggiungi il timestamp
    });

    message.value = 'Ferie salvate con successo!';
    selectedDate.value = null; // Reset the date picker
    await fetchVacationDays(); // Refresh the vacation days list
  } catch (error) {
    console.error("Errore nel salvataggio delle ferie: ", error);
    message.value = 'Si è verificato un errore. Riprova.';
  }
};
const fetchVacationDays = async () => {
  try {
    const storeId = store.getters.getIdDocumentNegozioGestore; // Fetch store ID
    // Fetch documents from the 'Ferie' collection under the specific store in 'Negozi'
    const querySnapshot = await getDocs(collection(db, "Negozi", storeId, "Ferie"));
    vacationDays.value = querySnapshot.docs.map(doc => ({
      id: doc.id,         // Document ID
      date: doc.data().date // Vacation day stored in the document
    }));
    console.log("Ferie recuperate", vacationDays.value);
  } catch (error) {
    console.error("Errore nel recupero dei giorni di ferie: ", error);
  }
};

const deleteVacation = async (id: string) => {
  const storeId = store.getters.getIdDocumentNegozioGestore; // Fetch store ID
  try {
    await deleteDoc(doc(db, "Negozi", storeId, "Ferie", id)); // Delete the vacation day document
    message.value = 'Ferie eliminate con successo!';
    await fetchVacationDays(); // Refresh the vacation days list
  } catch (error) {
    console.error("Errore nella cancellazione delle ferie: ", error);
    message.value = 'Si è verificato un errore. Riprova.';
  }
};

// Fetch vacation days when the component is mounted
onMounted(fetchVacationDays);
</script>


<style scoped>
.content-background {
  --background: #f5f5f5;
}
.div {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.date-item {
  --border-radius: 10px;
  --background: #f1f1f1;
  margin-bottom: 15px;
}

.date-picker {
  --background: #ffffff;
  --border-radius: 8px;
}

.submit-button {
  --background: #3880ff;
  --border-radius: 10px;
  --background-hover: #3171e0;
  --background-activated: #2e62d6;
}

.success-message {
  margin-top: 15px;
  color: green;
  text-align: center;
}
</style>
