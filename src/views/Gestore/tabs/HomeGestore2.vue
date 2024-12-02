<template>
    <ion-page>
      <ion-header>
        <ion-toolbar color="primary" >
          <ion-title>Home</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content>
        <div class="div-foto-nome">
          <div class="image-container">
          <img class="img" alt="Silhouette of mountains" :src="immagineNegozio" />
          <ion-progress-bar class="progress-bar"    v-show="mostraProgresBar" type="indeterminate" color="primary"></ion-progress-bar>
        </div>            
            <h1>{{nomeNegozio}}</h1>
            <h3>{{viaNegozio}}, {{cittaNegozio}}</h3>
            <h4>{{numeroCellulare}}</h4>
    
            <div class="description">
              <h6 class="h6-description">Descrizione</h6>
              <p>{{descrizioneNegozio}}</p>
            </div>
          </div>
    
          <div class="div-button-home">
            <ion-button class="custom-button" fill="outline" @click="inserisciServizi()">Modifica servizi</ion-button>
            <ion-button class="custom-button" fill="outline" @click="modificaOrariLavorativi()">Modifica orari lavorativi</ion-button>
            <ion-button class="custom-button" fill="outline" @click="InserisciFerie()">Inserisci ferie</ion-button>

          </div>
    
      </ion-content>
    </ion-page>
  </template>
  
  <script setup >
    import { ref, onMounted } from 'vue';
    import { IonProgressBar,IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/vue';
    import { getFirestore, getDoc, collection, query, where, getDocs,doc,setDoc } from 'firebase/firestore';
    import { getAuth } from 'firebase/auth';
    import { getStorage, getDownloadURL, ref as storageReference } from "firebase/storage";
    import { useRouter } from 'vue-router';
    import { useStore } from 'vuex';
    
    const db = getFirestore();
    const auth = getAuth();
    const storage = getStorage();
    const router = useRouter();
    const store = useStore();
    
    
    const nomeNegozio = ref('Nome del Negozio');
    const cittaNegozio = ref('Città del Negozio');
    const viaNegozio = ref('Via del Negozio');
    const numeroCellulare = ref('Numero di Cellulare');
    const immagineNegozio = ref('path/immagine.jpg');
    const descrizioneNegozio = ref('Descrizione del Negozio');
    const mostraProgresBar = ref(true);  // Stato di caricamento per la progress bar


    var idDocumentNegozio= ref('')

    
    const inserisciServizi = () => {
      router.push('/gestore/tabs/tab1gestore/inserisciServizi');
    };
    const InserisciFerie = () => {
      router.push('/gestore/tabs/tab1gestore/inserisciferie');
    };
    
    
    const modificaOrariLavorativi = () => {
      console.log('Modifica Orari Lavorativi');
      router.push('/registrazione/registrazioneClienteGestore/registrazioneNegozio/sceltaOrariLavorativi');
    };
    
    async function caricaDatiDaFirestore() {
      try {
        const currentUser = auth.currentUser


        console.log('currentUser', currentUser);
        
        // Cerca nel collezione Negozi
        let q = query(collection(db, 'Negozi'), where('proprietarioUid', '==', currentUser?.uid));
        let querySnapshot = await getDocs(q);
    
        // Se è trovato nel collezione Negozi o non è presente in nessuna delle collezioni sopra, continua il caricamento dei dati
        const docRef = querySnapshot.docs[0].ref;
        const docSnap = await getDoc(docRef);
    
        if (docSnap.exists()) {
          idDocumentNegozio.value = docSnap.id;
          console.log('id negozio=', idDocumentNegozio.value);
          store.dispatch('setIdDocumentNegozioGestore', idDocumentNegozio.value);
    
          
          nomeNegozio.value = docSnap.data().nomeNegozio || '';
          cittaNegozio.value = docSnap.data().cittaNegozio || '';
          viaNegozio.value = docSnap.data().indirizzoNegozio || '';
          numeroCellulare.value = docSnap.data().cellulareNegozio || '';
          descrizioneNegozio.value = docSnap.data().descrizioneNegozio || '';
          
          // Recupera l'URL dell'immagine dallo storage Firebase
          const immagineRef = storageReference(storage, `images/${idDocumentNegozio.value}`);
          immagineNegozio.value = await getDownloadURL(immagineRef);
          mostraProgresBar.value=false

        } else {
          console.log('Nessun negozio trovato per questo utente.');
          router.push('/registrazione/registrazioneClienteGestore/registrazioneNegozio'); // Naviga al secondo componente
        }
      } catch (error) {
        console.error('Errore durante il recupero dei dati da Firestore:', error);
      }
    }

    async function recuperaPrenotazioni() {
    // Usa un array per raccogliere le prenotazioni
    const prenotazioni = [];

    try {
        // Definisci la query per cercare le prenotazioni
        const q = query(
            collection(db, "Prenotazioni"), 
            where("idDocumentNegozio", "==", idDocumentNegozio.value)
        );

        // Esegui la query
        const querySnapshot = await getDocs(q);

        // Cicla i risultati della query e aggiungi le prenotazioni all'array
        querySnapshot.forEach(doc => {
            const dataDocumento = doc.data();
            dataDocumento.id = doc.id; // Aggiungi l'ID del documento
            prenotazioni.push(dataDocumento);
        });

        console.log('Prenotazioni recuperate:', prenotazioni);

    } catch (error) {
        console.error('Errore durante il recupero delle prenotazioni:', error);
    }
}

onMounted(async () => {
    const user = auth.currentUser;
    
    if (user) {
        try {
            console.log('Utente autenticato:', user.uid);
            
            await caricaDatiDaFirestore();
            console.log('Dati caricati con successo da Firestore.');

        } catch (error) {
            console.error('Errore durante il montaggio del componente:', error);
        }
    } else {
        console.log('Nessun utente autenticato.');
    }
});
    
</script>
    
    
    <style scoped>
    
    
    .div-foto-nome {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      border-radius: 10px;
      margin: 20px;
    }
    
    .img {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      object-fit: cover;
      box-shadow: 0 4px 8px var(--ion-color-secondary);;
      margin-bottom: 15px;
    }
    
    h1{
      font-size: xx-large;
      margin-top: 0px;
    }
    
    
    h3, h4 {
      margin: 5px 0;
      text-align: center;
      color: #333;
    }
    
    .h6-description{
      margin-top: 0%;
    }
    /* Stili per la descrizione */
    .description {
      padding: 15px;
      border-radius: 10px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      margin-top: 15px;
      width: 90%;
      max-width: 400px;
    
    }
    
    .description p {
      margin: 0;
      text-align: center;
      font-size: 1em;
    }
    
    /* Stili per i pulsanti */
    .div-button-home {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    
    .custom-button {
      width: 80%;
      max-width: 300px;
      margin: 10px 0;
    
      transition: transform 0.2s;
    }
    

    </style>
    