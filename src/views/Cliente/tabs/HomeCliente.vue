<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-loading :is-open="isOpenLoading" message="Please wait..."></ion-loading>
        <ion-title>Home</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="category-buttons"></div>

      <ion-searchbar
        class="ion-searchbar"
        animated="true"
        show-clear-button="focus"
        placeholder="Cerca per nome"
        :debounce="500"
        @ionInput="cercaPerNome($event)"

      ></ion-searchbar>

      <ion-searchbar
        class="ion-searchbar"
        v-model="cittaCliente"
        animated="true"
        show-clear-button="focus"
        placeholder="Cerca per città"
        :debounce="500"
        @click="openModal()" 
      ></ion-searchbar>

      <p class="scritta-nessuno" v-show="itemsCopy.size === 0">nessun negozio trovato in base alla città o al nome</p>


      <div class="shop-cards">
        <ion-card
          class="shop-card"
          v-for="(item, index) in itemsCopy"
          :key="index"
          @click="open(item)"
        >
          <img class="card-image" alt="Image of shop" :src="item.imageUrl" />
          <ion-progress-bar v-show="mostraProgresBar" :value="progress / 100" color="primary"></ion-progress-bar>
          <ion-card-header class="card-header">
            <ion-card-title>{{ item.nomeNegozio }}</ion-card-title>
          </ion-card-header>
          <div class="line"></div>
          <ion-card-content class="card-content">
            {{ item.indirizzoNegozio + "," + item.cittaNegozio }}
          </ion-card-content>
        </ion-card>
      </div>




      <ion-modal :is-open="isModalOpen" @didDismiss="closeModal" :initial-breakpoint="0.75" :breakpoints="[0, 0.25, 0.5, 0.75]">
        <ion-content class="ion-padding">
              <ion-searchbar
              class="ion-searchbar"
              animated="true"
              show-clear-button="focus"
              placeholder="Inserisci la citta che vuoi cercare"
              :debounce="500"
              @ionInput="cercaPerCitta($event)"
            ></ion-searchbar>
          <ion-list>
            <ion-list  class="suggestions-list">
              <ion-item
                v-for="(suggestion, index) in suggestions"
                :key="index"
                @click="selectCity(suggestion)"
                lines="full"
                detail
              >
                {{ suggestion }}
              </ion-item>
            </ion-list>
        
          </ion-list>
        </ion-content>
    </ion-modal>

    </ion-content>
 

  </ion-page>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { getFirestore, query,collection, getDocs, doc, getDoc, setDoc, where } from 'firebase/firestore';
import { IonProgressBar, IonSearchbar, IonPage, IonLoading, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonModal, IonCardHeader, IonCardTitle, IonCardSubtitle, IonButton, IonList, IonItem, IonLabel } from '@ionic/vue';
import { getAuth } from "firebase/auth";
import { getStorage, uploadBytes, getDownloadURL, ref as storageReference } from "firebase/storage";
import comuni from '/src/comuni.json';

const nomiComuniFiltrativalue = comuni.map(oggetto => oggetto.nome);


// External required step for push notifications
// register for push

const storage = getStorage();
const user = ref(null);
const items = ref([]);
const router = useRouter();
const store = useStore();
const db = getFirestore();
const auth = getAuth();
const isOpenLoading = ref(false);
let itemsCopy = ref([]);
const cittaCliente = ref('');
const userUid = ref("")
const mostraProgresBar=ref(true)
const progress = ref(0); // Per tracciare il progresso di ogni immagine
const suggestions = ref([]);

const isModalOpen = ref(false);

// Funzione per aprire il modal
const openModal = () => {
  isModalOpen.value = true;
  console.log("click")
};
const closeModal = () => {
  isModalOpen.value = false;
};

// Funzione per la ricerca per città
function cercaPerCitta(event) {
  const searchValue = event.target.value.toLowerCase();
  console.log("cercaper citta")

  if (searchValue === "") {
    suggestions.value = [nomiComuniFiltrativalue];
  } else {
    // Filtra le città che contengono la ricerca dell'utente
    console.log(nomiComuniFiltrativalue)
    suggestions.value = nomiComuniFiltrativalue.filter(nome => nome.toLowerCase().includes(searchValue));
    console.log("suggestion",suggestions.value)
  }
}

// Funzione per selezionare una città dal suggerimento
async function selectCity(city) {
  cittaCliente.value = city; // Imposta la città selezionata nella searchbar
  suggestions.value = []; // Nascondi i suggerimenti
  closeModal()
  await loadNegozi(city); // Carica i negozi in base alla città selezionata
  itemsCopy.value = items.value
  await recuperaImmagini()
  itemsCopy.value = items.value
}



// Funzione per la ricerca per nome
function cercaPerNome(event) {
  console.log("Input Value:", event.target.value);
  const searchValue = event.target.value.toLowerCase();

  if (searchValue === "") {
    // Se non c'è alcun valore di ricerca, mostriamo tutti gli elementi
    itemsCopy.value = [...items.value]; // Ritorna alla lista completa degli elementi
  } else {
    console.log("Filtering items based on search value:", searchValue);
    itemsCopy.value = items.value.filter(item =>
      item.nomeNegozio.toLowerCase().includes(searchValue)
    );
  }
  console.log("Updated itemsCopy size:", itemsCopy.value.length);
}


// Funzione per caricare i negozi e tracciare il progresso
const loadNegozi = async (citta_cliente) => {
  try {
    console.log('Inizio caricamento negozi...');
    isOpenLoading.value = true;

    // Effettua la query, assicurandoti di aspettare che venga completata
    const querySnapshotNegozi = await getDocs(query(collection(db, 'Negozi'), where('cittaNegozio', '==',citta_cliente)));

    console.log('Documenti negozi recuperati:', querySnapshotNegozi.size);

    // Mappa i documenti recuperati
    items.value = querySnapshotNegozi.docs.map(doc => {
      return {
        id: doc.id,  // ID del documento
        ...doc.data(),  // Altri dati del documento
      };
    });

    isOpenLoading.value = false;
  } catch (error) {
    isOpenLoading.value = false;
    console.error('Errore durante il recupero dei negozi:', error.message);
  }
};

const recuperaImmagini = async () => {
  progress.value = 0; // Reset del progresso
  const totalDocs = items.value.length; // Numero totale di negozi
  
  // Utilizza Promise.all per recuperare tutte le immagini in parallelo
  items.value = await Promise.all(items.value.map(async (doc, index) => {
    const storageRef = storageReference(storage, `images/${doc.id}`);
    let imageUrl = '';

    try {
      // Recupero dell'URL dell'immagine
      imageUrl = await getDownloadURL(storageRef);
      console.log(`URL immagine per il negozio con ID ${doc.id}:`, imageUrl);

      // Aggiorna il progresso ogni volta che un'immagine è stata caricata
      progress.value = ((index + 1) / totalDocs) * 100;
      console.log(`Progresso: ${progress.value}%`);
    } catch (error) {
      // Gestisci gli errori relativi al recupero dell'URL di download
      switch (error.code) {
        case 'storage/object-not-found':
          console.error(`File non trovato per il negozio con ID ${doc.id}`);
          break;
        case 'storage/unauthorized':
          console.error(`Utente non autorizzato per il negozio con ID ${doc.id}`);
          break;
        default:
          console.error(`Errore sconosciuto durante il recupero dell'URL di download per il negozio con ID ${doc.id}:`, error);
          break;
      }
    }

    // Restituisci i dati del negozio e l'URL dell'immagine
    return {
      id: doc.id,  // ID del negozio
      ...doc, // Dati del negozio
      imageUrl,  // Aggiungi l'URL dell'immagine
    };
  }));

  // Una volta che tutte le immagini sono state caricate, il progresso è completo (100%)
  progress.value = 100;
  console.log('Caricamento delle immagini completato.');
};



// Funzione per recuperare la città del cliente
const recuperaCittaCliente = async () => {
  try {

    const clienteDocRef = doc(db, 'Cliente', userUid.value);
    const clienteDocSnap = await getDoc(clienteDocRef);

    if (clienteDocSnap.exists()) {
      cittaCliente.value = clienteDocSnap.data().citta;
      console.log("citta cliente=" + cittaCliente.value);
    
    } else {
      console.log('Il documento non esiste.');
    }
  } catch (error) {
    console.error('Errore durante il recupero del documento:', error.message);
  }
};

// Funzione per aprire il negozio selezionato
const open = (item) => {
  try {
    console.log("id document on click " + item.id);

    store.dispatch('setIdDocumentNegozioSelezionato', item.id);
    store.dispatch('setUrlNegozioSelezionato', item.imageUrl);
  } catch (error) {
    console.error(error.message);
  }
  router.push('/cliente/tabs/tab1/informazioniNegozio'); // Naviga al secondo componente
};

onMounted(async () => {
  mostraProgresBar.value=false

  userUid.value= auth.currentUser.uid
  await recuperaCittaCliente()
  await loadNegozi(cittaCliente.value);
  itemsCopy.value = items.value

  await recuperaImmagini()
  itemsCopy.value = items.value
  mostraProgresBar.value=false
  
});
</script>

  

  <style scoped>

.shop-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); /* Colonne responsivi */
}

.shop-card {
  display: flex;
  flex-direction: column;
  background: #fb890f;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
}


.card-image {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 10px 10px 0 0;
}

.card-header {
  font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
  padding: 3px;
  padding-left: 3%;
}


.line {
  height: 1px;
  background-color: #000000;
  margin-top: 0px;
  margin-left: 2%;
  margin-right:2%;

}

.card-content {
  font-size: 14px;
  color: #000000;
  padding: 0 10px 10px 10px;
}

@media (max-width: 600px) {
  .shop-cards {
    grid-template-columns: 1fr; /* 1 colonna per schermi più piccoli */
  }
}



.suggestions-list ion-item {
  cursor: pointer;
}

  ion-progress-bar::part(track) {
   background: #f3e895;
 }

 ion-progress-bar::part(progress) {
   background: #09c567;
 }

 ion-progress-bar::part(stream) {
   background-image: radial-gradient(ellipse at center, #e475f3 0%, #e475f3 30%, transparent 30%);
 }
 .category-buttons {
   display: flex;
   overflow-x: auto;
   gap: 8px;
   margin-top: 0px;
 }
 
 .category-button {
   border-radius: 30%;
   margin-top: 0px;
 }

 .ion-searchbar {
   --background: #ff9e36; /* Colore di sfondo */
   --color: #000000; /* Colore del testo */
   --placeholder-color: #000000; /* Colore del segnaposto */
   --icon-color: #000000; /* Colore delle icone */
   --clear-button-color: #000000; /* Colore del pulsante di cancellazione */
   --border-radius: 4px;
 }
 
 </style>
 
 
 
  