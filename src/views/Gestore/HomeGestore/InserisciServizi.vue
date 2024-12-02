<template>
<ion-page>
    <ion-header>
    <ion-toolbar color="primary" >
        <ion-title>Servizi</ion-title>
        <BackButton></BackButton>
    </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
        <ion-list >
        <ion-item v-for="servizio in setServizi" :key="servizio">
          <ion-label>
            <h2>{{ servizio.nome }}</h2>
            <p>Durata: {{ servizio.durata }} min</p>
            <p>Costo: €{{ servizio.costo }}</p>
          </ion-label>
          <!-- Aggiungi il pulsante Elimina e collega la funzione eliminaServizio -->
          <ion-button @click="eliminaServizio(servizio.nome)">Elimina</ion-button>
        </ion-item>
      </ion-list>

      <p class="scritta-nessuno" v-show="setServizi.size===0" >nessun servizio registrato</p>

    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="apriModalInserimento">+
        </ion-fab-button>
    </ion-fab>
    </ion-content>

    <ion-modal :is-open="modalInserimento">
    <ion-header>
        <ion-toolbar>
        <ion-title>Nuovo Servizio</ion-title>
            <ion-button @click="chiudiModalInserimento">Chiudi</ion-button>
        </ion-toolbar>
    </ion-header>


    <ion-content class="ion-padding">
        <ion-item>
        <ion-label position="stacked">Nome</ion-label>
        <ion-input  v-model="nome"></ion-input>
        </ion-item>

        <ion-item>
        <ion-label position="stacked">Durata</ion-label>
        <ion-select  v-model="durata" interface="action-sheet" placeholder="Inserisci la durata del servizio">
            <ion-select-option :value="minuti" v-for="minuti in opzioniDurata" :key="minuti">
            {{ minuti }} min
            </ion-select-option>
        </ion-select>
        </ion-item>

        <ion-item>
        <ion-label  position="stacked">Costo (€)</ion-label>
        <ion-input  type="number" v-model="costo"></ion-input>
        </ion-item>

        <ion-button expand="full" @click="inserisciDatiInFirestore">Inserisci Servizio</ion-button>
    </ion-content>
    </ion-modal>
</ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { getFirestore, collection, getDocs, addDoc,doc,setDoc,updateDoc,query,deleteDoc} from 'firebase/firestore';
import {
toastController,
IonPage,
IonHeader,
IonToolbar,
IonTitle,
IonSelect,
IonContent,
IonList,
IonItem,
IonFab,
IonFabButton,
IonIcon,
IonModal,
IonLabel,
IonButtons,
IonButton,
IonInput,
IonDatetime,
IonSelectOption
} from '@ionic/vue';
import BackButton from '/src/views/Components/BackButton.vue';
import { useRouter } from 'vue-router';



const router = useRouter();

const store = useStore();
const db = getFirestore();

const servizi = ref([]);
const modalInserimento = ref(false);

const nome = ref('')
const durata = ref('')
const costo = ref('')
const idDocumentNegozioGestore = store.getters.getIdDocumentNegozioGestore;
let setServizi = ref(new Set());



const opzioniDurata = Array.from({ length: (200 - 15) / 15 + 1 }, (_, index) => 15 + index * 15);

onMounted(async () => {
await recuperaServizi();
console.log("setServizi"+setServizi.value);
});

const apriModalInserimento = () => {
modalInserimento.value = true;
};

const chiudiModalInserimento = () => {
    modalInserimento.value = false;
    recuperaServizi();
};

async function inserisciDatiInFirestore() {

    if (controllaDatiInserimento()) {
        try {
            const nuovoServizio = {
            servizi: {
                nome: nome.value,
                durata: durata.value,
                costo: costo.value
            }
            };
            await setDoc(doc(db, "Negozi",idDocumentNegozioGestore , "Servizi", nome.value), {
                nome: nome.value,
                durata: durata.value,
                costo: costo.value
            });

            chiudiModalInserimento();
        } catch (error) {
            console.error("Errore durante l'aggiornamento del servizio:", error);
        }
    } else {
        
    }
}

const recuperaServizi = async () => {
    const setServiziCopy = new Set();
      try {
        console.log('recupera servizi, id document:', idDocumentNegozioGestore);
        

        const collezioneInternaRef = collection(db, 'Negozi',idDocumentNegozioGestore, 'Servizi');
        const q = query(collezioneInternaRef);

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          const datiDocumento = doc.data();
          setServiziCopy.add(datiDocumento);
        });

        setServizi.value= setServiziCopy

      } catch (error) {
        console.error('Errore durante il recupero dei documenti interni:', error);
      }
};

const eliminaServizio = async (nomeServizio) => {
  try {
    const docRef = doc(db, "Negozi",idDocumentNegozioGestore, "Servizi", nomeServizio);
    await deleteDoc(docRef);
    await recuperaServizi();
  } catch (error) {
    console.error("Errore durante l'eliminazione del servizio:", error);
  }
};

const controllaDatiInserimento = async () => {
    console.log("controllo: " + nome.value + " " + durata.value + " " + costo.value);
  // Verifica che il campo Nome non sia vuoto
  if (nome.value === "") {
    await mostraToast('Il campo Nome non può essere vuoto.');
    return false;
  }

  // Verifica che Durata sia stata selezionata
  if (durata.value === "") {
    await mostraToast('Seleziona una durata valida.');
    return false;
  }
  
  if (costo.value === "") {
    await mostraToast('Inserisci un costo valido.');
    return false;
  }

  // Tutte le validazioni sono passate, i dati sono validi
  return true;
};


async function mostraToast(message) {
        const toast = await toastController.create({
          message: message,
          duration: 2000,
        });
        await toast.present();
};      
</script>

<style scoped>
/* Aggiungi stili CSS per personalizzare l'aspetto del componente */
.scritta-nessuno{
  display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;

}
</style>
  