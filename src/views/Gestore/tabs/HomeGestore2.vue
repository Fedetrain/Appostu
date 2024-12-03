<template>
    <ion-page>
      <ion-header>
        <ion-toolbar color="primary" >
          <ion-title>Home</ion-title>
          <ion-loading :is-open="isOpenLoading" message="Please wait..." class="loading-spinner"></ion-loading>

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
            <ion-button class="custom-button" fill="outline" @click="apriModaleModifica()">Modifica informazioni</ion-button>

            <ion-button class="custom-button" fill="outline" @click="inserisciServizi()">Modifica servizi</ion-button>
            <ion-button class="custom-button" fill="outline" @click="modificaOrariLavorativi()">Modifica orari lavorativi</ion-button>
            <ion-button class="custom-button" fill="outline" @click="InserisciFerie()">Inserisci ferie</ion-button>

          </div>
      </ion-content>

      <ion-modal :is-open="mostraModaleModifica" @ion-modal-did-dismiss="chiudiModaleModifica">
            <ion-header>
              <ion-toolbar color="primary">
                <ion-title>Modifica informazioni</ion-title>
                <ion-buttons slot="end">
                  <ion-button @click="chiudiModaleModifica">Chiudi</ion-button>
                </ion-buttons>
              </ion-toolbar>
            </ion-header>
            <ion-content>
              <div class="form-container">
                <ion-item class="item">
                  <ion-label position="stacked">Immagine del negozio</ion-label>
                  <ion-button class="upload-btn" @click="caricaImmagine()">{{ testoBottone }}</ion-button>
                </ion-item>
                
                <ion-item class="item">
                  <ion-label position="stacked">Nome</ion-label>
                  <ion-input v-model="nomeNegozioModifica" class="input-field"></ion-input>
                </ion-item>
                
                <ion-item class="item">
                  <ion-label position="stacked">Via</ion-label>
                  <ion-input v-model="viaNegozioModifica" class="input-field"></ion-input>
                </ion-item>
                
                <ion-item class="item">
                  <ion-label position="stacked">Città</ion-label>
                  <ion-input v-model="cittaNegozioModifica" class="input-field"></ion-input>
                </ion-item>
                
                <ion-item class="item">
                  <ion-label position="stacked">Numero di cellulare</ion-label>
                  <ion-input v-model="numeroCellulareModifica" class="input-field"></ion-input>
                </ion-item>
                
                <ion-item class="item">
                  <ion-label position="stacked">Descrizione</ion-label>
                  <ion-textarea v-model="descrizioneNegozioModifica" class="input-field"></ion-textarea>
                </ion-item>
                
                <ion-button class="save-btn" expand="block" @click="salvaModifiche">Salva modifiche</ion-button>
              </div>
            </ion-content>
          </ion-modal>
    </ion-page>
  </template>
  
  <script setup >
    import { ref, onMounted } from 'vue';
    import { IonLoading,IonProgressBar,IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton,IonLabel,IonInput,IonItem,IonModal,IonTextarea,IonButtons } from '@ionic/vue';
    import { getFirestore, getDoc, collection, query, where, getDocs,doc,setDoc } from 'firebase/firestore';
    import { getAuth } from 'firebase/auth';
    import { getStorage, getDownloadURL, ref as storageReference,uploadBytes } from "firebase/storage";
    import { useRouter } from 'vue-router';
    import { useStore } from 'vuex';
    import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

    
    const db = getFirestore();
    const auth = getAuth();
    const storage = getStorage();
    const router = useRouter();
    const store = useStore();
    let photo;
    const testoBottone= ref("Clicca per caricare una nuova foto")
    let isOpenLoading=ref(false);

    
    
    const nomeNegozio = ref('Nome del Negozio');
    const cittaNegozio = ref('Città del Negozio');
    const viaNegozio = ref('Via del Negozio');
    const numeroCellulare = ref('Numero di Cellulare');
    const immagineNegozio = ref('path/immagine.jpg');
    const descrizioneNegozio = ref('Descrizione del Negozio');
    const mostraProgresBar = ref(true);  // Stato di caricamento per la progress bar
    var idDocumentNegozio= ref('')

  

    const mostraModaleModifica = ref(false); // Per gestire la visibilità del modale

// Variabili per modificare i dati
const nomeNegozioModifica = ref('');
const viaNegozioModifica = ref('');
const cittaNegozioModifica = ref('');
const numeroCellulareModifica = ref('');
const descrizioneNegozioModifica = ref('');
let nuovaImmagine = null

// Apri il modale di modifica
const apriModaleModifica = () => {
  mostraModaleModifica.value = true;

  // Popola i campi con i valori attuali
  nomeNegozioModifica.value = nomeNegozio.value;
  viaNegozioModifica.value = viaNegozio.value;
  cittaNegozioModifica.value = cittaNegozio.value;
  numeroCellulareModifica.value = numeroCellulare.value;
  descrizioneNegozioModifica.value = descrizioneNegozio.value;
};

// Chiudi il modale
const chiudiModaleModifica = () => {
  testoBottone.value= "Clicca per caricare una nuova foto"
  mostraModaleModifica.value = false;
};

// Carica immagine selezionata
const caricaImmagine = async () => {
  try {
      photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
      quality: 90,
    });
    nuovaImmagine = photo.webPath;

    testoBottone.value="Immagine caricata con successo. Premi il pulsante salva"

  } catch (error) {
    console.error('Errore durante la selezione o il caricamento dell\'immagine:', error);
  }
};

async function uriToBlob(uri) {
  return new Promise((resolve, reject) => {
    try {
      // Fetch the file content using the URI
      fetch(uri)
        .then((response) => response.blob())
        .then((blob) => resolve(blob))
        .catch((error) => reject(error));
    } catch (error) {
      reject(error);
    }
  });
}

// Salva modifiche
const salvaModifiche = async () => {
  isOpenLoading.value= true
var nuovoImmagineURL 
  try {
    // Aggiorna i dati in Firestore
    const docRef = doc(db, 'Negozi', idDocumentNegozio.value);
    const aggiornamenti = {
      nomeNegozio: nomeNegozioModifica.value,
      indirizzoNegozio: viaNegozioModifica.value,
      cittaNegozio: cittaNegozioModifica.value,
      cellulareNegozio: numeroCellulareModifica.value,
      descrizioneNegozio: descrizioneNegozioModifica.value,
    };

    // Aggiorna immagine se presente
    if (nuovaImmagine) {
      const storage = getStorage();
    const storageRef = storageReference(storage, `/images/${docRef.id}`);
    const blob = await uriToBlob(photo.webPath);

    await uploadBytes(storageRef, blob).then((snapshot) => {
      console.log('Immagine caricata con successo per il negozio con ID:', docRef.id);
    });

    nuovoImmagineURL = await getDownloadURL(storageRef);

    }

    await setDoc(docRef, aggiornamenti, { merge: true });

    // Aggiorna valori locali
    nomeNegozio.value = nomeNegozioModifica.value;
    viaNegozio.value = viaNegozioModifica.value;
    cittaNegozio.value = cittaNegozioModifica.value;
    numeroCellulare.value = numeroCellulareModifica.value;
    descrizioneNegozio.value = descrizioneNegozioModifica.value;
    if (nuovaImmagine) {
      immagineNegozio.value = nuovoImmagineURL;
    }

    chiudiModaleModifica();
    console.log('Modifiche salvate con successo.');
  } catch (error) {
    console.error('Errore durante il salvataggio delle modifiche:', error);
  }
  finally{
    isOpenLoading.value=false
  }
};
















    
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
    mostraProgresBar.value=true
    
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
    mostraProgresBar.value=false

});
    
</script>
    
    
    <style scoped>
    
    
    .div-foto-nome {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      border-radius: 10px;
    }
    
    .img {
      width: 200px;
      height: 200px;
      border-radius: 20%;
      object-fit: cover;
      box-shadow: 0 4px 8px var(--ion-color-secondary);;
    }
    
    h1{
      font-size: xx-large;
      margin-top: 0px;
    }
    
    
    h3, h4 {
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



    .form-container {
      display: flex;
      flex-direction: column;
      padding: 20px;
      gap: 15px;
    }

    ion-item {
      --padding-start: 0;
    }

    ion-input, ion-textarea {
      border: 1px solid var(--ion-color-primary-shade);
      border-radius: 5px;
      padding: 10px;
      font-size: 1em;
    }

    /* Contenitore principale del form */
.form-container {
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* Stili per ogni item */
.item {
  --padding-start: 0;
}

/* Stili per i campi di input */
.input-field {
  border-radius: 8px;
  padding: 4px;
  font-size: 1rem;
}


/* Stili per il pulsante di caricamento immagine */
.upload-btn {
  margin-top: 0%;
  width: 100%;
  border-radius: 8px;
  padding: 4px 0;
  font-weight: bold;
  transition: background-color 0.3s;
}

/* Stili per il pulsante "Salva modifiche" */
.save-btn {
  font-weight: bold;
  border-radius: 8px;
  transition: background-color 0.3s;
}

    </style>
    