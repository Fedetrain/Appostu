<template>
    <ion-page>
      <ion-header>
        <ion-toolbar color="primary"  >
          <ion-loading :is-open="isOpenLoading" message="Please wait..."></ion-loading>
          <ion-title>Home</ion-title>
  
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding">
        <div class="category-buttons">
  
        </div>
  
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
          @ionInput="cercaPerCitta($event)"
          value="{{ cittaCliente }}"
        ></ion-searchbar>
  
        <p class="scritta-nessuno" v-show="itemsCopy.size===0" >nessun negozio trovato in base alla città o al nome</p>
  
        <div class="shop-cards">
          <ion-card class="ion-card" v-for="(item, index) in itemsCopy" :key="index" @click="open(item)">
            <img class="card-image" alt="Silhouette of mountains" :src="item.imageUrl" />
            <ion-card-header>
              <ion-card-title>{{ item.nomeNegozio }}</ion-card-title>
            </ion-card-header>
            <div class="line"></div>
  
            <ion-card-content >
              {{ item.indirizzoNegozio + "," + item.cittaNegozio }}
            </ion-card-content>
          </ion-card>
        </div>
      </ion-content>
    </ion-page>
  </template>
  
  <style scoped>
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
  
  .shop-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); /* Layout a griglia con colonne adattive */
  }
  
  .ion-card {
    display: flex;
    flex-direction: column;
    background-color: #fb871b;  
    border-radius: 12px;
  }
  ion-card-content{
    color: #000000;
  }
  ion-card-header {
    height: 50px;
  }
  
  .card-image {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: 12px 12px 0 0; /* Bordi arrotondati solo in alto */
  }
  
  ion-card-title {
    font-size: 1.5rem; /* Dimensione del testo del titolo */
    font-weight: bold; /* Testo in grassetto */
  
  }
  
  .line {
    height: 1px;
    background-color: rgb(0, 0, 0); /* Colore della linea più leggero */
    margin-left: 10px;
    margin-right: 10px;
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
  
  
  
  <script setup>
  import { ref,onMounted,reactive} from 'vue';
  import { useStore } from 'vuex';
  import { useRouter } from 'vue-router';
  import { getFirestore, collection, getDocs,doc,getDoc,setDoc } from 'firebase/firestore';
  
  import {IonSearchbar ,IonPage,IonLoading,IonHeader,IonToolbar,IonTitle,IonContent,IonCard,IonCardContent,IonImg,IonCardHeader,IonCardTitle,IonCardSubtitle,IonButton,IonList,IonItem,IonLabel,} from '@ionic/vue';
  import { getAuth} from "firebase/auth";
  import { getStorage,uploadBytes, getDownloadURL ,ref as storageReference } from "firebase/storage";
  import { PushNotifications } from '@capacitor/push-notifications';
  import { getMessaging, getToken,onMessage} from "firebase/messaging";
  
  
  // external required step
  // register for push
  
  const messaging = getMessaging();
  
  
  
  const storage = getStorage();
  
  const user = ref(null);
  const items = ref([]);
  const router = useRouter();
  const store = useStore();
  const db = getFirestore();
  const auth= getAuth();
  const isOpenLoading = ref(false);
  let itemsCopy = ref([]);
  const cittaCliente= ref('');
  
  
  
  
  const takeToken = async () => {
    try {
      const token = await getToken(messaging, {
        vapidKey: "BMO62eGEOXOUABQGMsOQMNjgYAKARfJVjcRv5UsUlGvtRWKuvdDp1zp6qe7-KMhhZ-JBsn0s5m_VjZksm-AudxM",
      });
  
      if (token) {
        console.log("Token ottenuto:", token);
        await updateTokenToDb(token);  // Aggiorna il token sul server
        //sendTokenToServer(token)
      } else {
        console.log("Nessun token disponibile. La registrazione potrebbe non funzionare.");
      }
    } catch (error) {
      console.error("Errore durante il recupero del token:", error);
    }
  };
  
  
  const registerForNotifications = async () => {
    console.log("Registrazione per le notifiche");
    // Richiedi i permessi per le notifiche
    const permissionStatus = await PushNotifications.requestPermissions();
  
    if (permissionStatus.receive === 'granted') {
      // Registrazione per le notifiche push
      await PushNotifications.register();
  
  
      // Gestisci eventuali errori
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Errore durante la registrazione per le notifiche push:', error);
      });
    } else {
      console.error('Permessi per le notifiche non concessi');
    }
  };
  
  
  
  
  
  function cercaPerCitta(event) {
    itemsCopy.value = items.value
    console.log("Input Value:", event.target.value);
    const searchValue = event.target.value.toLowerCase();
  
    if (searchValue === "") {
  
    } else {
      console.log("Filtering items based on search value:", searchValue);
      itemsCopy.value = items.value.filter((negozio) => negozio.cittaNegozio.toLowerCase().includes(searchValue));
    }
    console.log("Updated itemsCopy size:", itemsCopy.value.length);
  }
  
  function cercaPerNome(event) {
    itemsCopy.value = items.value
    console.log("Input Value:", event.target.value);
    const searchValue = event.target.value.toLowerCase();
  
    if (searchValue === "") {
  
    } else {
      console.log("Filtering items based on search value:", searchValue);
      itemsCopy.value = items.value.filter((negozio) => negozio.nomeNegozio.toLowerCase().includes(searchValue));
    }
    console.log("Updated itemsCopy size:", itemsCopy.value.length);
  }
  
  const loadNegozi = async () => {
    try {
      console.log('Inizio caricamento negozi...');
      isOpenLoading.value = true;
  
      const negoziCollection = collection(db, 'Negozi');
      const querySnapshot = await getDocs(negoziCollection);
      console.log('Documenti negozi recuperati:', querySnapshot.size);
  
      items.value = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const storageRef = storageReference(storage, `images/${doc.id}`);
        let imageUrl = '';
  
        try {
          imageUrl = await getDownloadURL(storageRef);
          console.log(`URL immagine per il negozio con ID ${doc.id}:`, imageUrl);
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
  
        return {
          id: doc.id, // ID del documento
          ...doc.data(), // Altri dati del documento
          imageUrl, // URL di download dell'immagine
        };
      }));
  
      await recuperaCittaCliente();
      console.log('Items dopo recuperaCittaCliente:', items.value);
      isOpenLoading.value = false;
  
      console.log('Negozi caricati:', items.value);
    } catch (error) {
      isOpenLoading.value = false;
      console.error('Errore durante il recupero dei negozi:', error.message);
    }
  };
  
  const updateTokenToDb = async (token) => {
    try {
      const userUid = auth.currentUser.uid; // Assicurati che l'utente sia autenticato
  
      // Referenzia il documento dell'utente nella collezione 'Clienti'
      const userDocRef = doc(db, 'Clienti', userUid);
  
      // Aggiorna o imposta il token nel documento utente
      await setDoc(userDocRef, { fcmToken: token }, { merge: true });
  
      console.log("Token aggiornato nel database con successo");
    } catch (error) {
      console.error("Errore durante l'aggiornamento del token nel database:", error.message);
    }
  };
  
  const recuperaCittaCliente = async () => {
    try {
      const userUid = auth.currentUser.uid
      const clienteDocRef = doc(db, 'Cliente', userUid);
      const clienteDocSnap = await getDoc(clienteDocRef);
  
      if (clienteDocSnap.exists()) {
        cittaCliente.value = clienteDocSnap.data().citta;
        console.log("citta cliente=" + cittaCliente.value)
        itemsCopy.value = items.value.filter((negozio) => negozio.cittaNegozio.toLowerCase().includes(cittaCliente.value.toLowerCase()));
  
      } else {
        console.log('Il documento non esiste.');
        isOpenLoading.value = false;
  
      }
    } catch (error) {
      console.error('Errore durante il recupero del documento:', error.message);
      isOpenLoading.value = false;
  
    }
  };
  
  
  onMounted(async () => {
    await loadNegozi();
    //await takeToken()
    //registerForNotifications();
    
  });
  
  
  
  
  
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
  
  </script>
  
  