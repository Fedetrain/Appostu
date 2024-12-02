<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Orari della settimana</ion-title>
        <ion-loading
          :is-open="isOpenLoading"
          message="Please wait...">
        </ion-loading>
        <BackButton></BackButton>

      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="div-principale">
        <div class="div-nome-giorni">
          <div class="div-nome-giorno" v-for="(giorno, index) in giorni" :key="index">
            <p>{{ giorno }}</p>
          </div>
        </div>

        <div class="div-orari" v-if="finito">
          <div class="div-colonna-orari" v-for="(giorno, index) in giorni" :key="index">
            <ion-button
            class="button-orario"
              v-for="(orario, index2) in orari"
              :key="index2"
              @click="toggleOrario(giorno, orario)"
              :color="isOrarioSelezionato(giorno, orario) ? 'tertiary' : 'primary'"          
            >
              {{ orario }}
            </ion-button>
          </div>
        </div>

        <ion-button expand="block" @click="salvaOrari">Salva Orari</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref,reactive,onMounted } from 'vue';
import { IonLoading,toastController,IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonButton } from '@ionic/vue';
import { getFirestore,setDoc,updateDoc ,doc,query, where, getDocs,collection,getDoc} from "firebase/firestore"; 
import { getAuth } from "firebase/auth";
import { useRouter } from 'vue-router';

import { useStore } from 'vuex';
import BackButton from '/src/views/Components/BackButton.vue';


const store = useStore();
const router = useRouter();

const auth= getAuth();
const db = getFirestore();

const giorni = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const orari = generaOrari();

let orariSalvati = reactive(new Map());
const isOpenLoading = ref(false);
const finito= ref(false)



onMounted(async () => {
  await recuperaTuttiOrariLavorativi();

});


function isOrarioSelezionato(giorno, orario) {
  console.log("is orario selezionato",orariSalvati.has(giorno) && orariSalvati.get(giorno).includes(orario) )
  return orariSalvati.has(giorno) && orariSalvati.get(giorno).includes(orario);
}

async function presentToast(message) {
        const toast = await toastController.create({
          message: message,
          duration: 3000,
        });
        await toast.present();
}; 

async function recuperaTuttiOrariLavorativi() {
  isOpenLoading.value=true;
  const uid=auth.currentUser.uid
  console.log(uid, "uid")

    try {

        const q = query(collection(db, "Negozi"), where("proprietarioUid", "==", uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const orariObject = doc.data().orariLavorativi;

            if (orariObject) {
                const orari = new Map(Object.entries(orariObject));
                orariSalvati=orari
                console.log("Orari Lavorativi:", orari);
                finito.value=true;
                isOpenLoading.value=false;


            } else {
              finito.value=true;
              isOpenLoading.value=false;
              console.log("Il campo orariLavorativi è nullo.");
            }
            isOpenLoading.value=false;

        } else {
          isOpenLoading.value=false;

          finito.value=true;

            console.log('Nessun documento trovato con proprietarioUid.');
        }
    } catch (error) {
      finito.value=true;
      isOpenLoading.value=false;

        console.error('Errore durante il recupero degli orari:', error);
    }
}

function toggleOrario(giorno, orario) {
  console.log("Inizio toggleOrario");
  finito.value=false;

  if (orariSalvati.has(giorno)) {
    let valoriEsistenti = orariSalvati.get(giorno);

    if (valoriEsistenti.includes(orario)) {
      // Rimuovi l'orario dalla mappa
      valoriEsistenti = valoriEsistenti.filter((o) => o !== orario);
      orariSalvati.set(giorno, valoriEsistenti);
      console.log(`Rimosso orario ${orario} da ${giorno}`);
    } else {
      // Aggiungi l'orario alla mappa
      valoriEsistenti.push(orario);
      orariSalvati.set(giorno, valoriEsistenti);
      console.log(`Aggiunto orario ${orario} a ${giorno}`);
    }
  } else {
    // Se la mappa non ha ancora il giorno, aggiungi il giorno e l'orario
    orariSalvati.set(giorno, [orario]);
    console.log(`Creata nuova entry per ${giorno} con orario ${orario}`);
  }
  finito.value=true;

  console.log("Fine toggleOrario");
}


function generaOrari() {
  const orari = [];
  let currentTime = new Date();
  currentTime.setHours(7, 0, 0, 0); // Inizia da 7:00
  const endTime = new Date();
  endTime.setHours(21, 0, 0, 0); // Termina alle 13:00

  while (currentTime <= endTime) {
    orari.push(currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    currentTime.setMinutes(currentTime.getMinutes() + 15);
  }

  return orari;
}

async function recuperaIDNegozioPerUID() {

  const negoziCollectionRef = collection(db, 'Negozi');
  const userUid = auth.currentUser.uid;
  console.log("useruid"+userUid);
  const q = query(negoziCollectionRef, where('proprietarioUid', '==', userUid));

  try {
    isOpenLoading.value=true;

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Prendi solo l'ID del primo documento trovato
      const idPrimoNegozio = querySnapshot.docs[0].id;
      
      console.log('ID del negozio recuperato:', idPrimoNegozio);

      isOpenLoading.value=false;

      return idPrimoNegozio;
    } else {
      console.log('Nessun negozio trovato con UID ');
      isOpenLoading.value=false;

      return null;
    }
  } catch (error) {
    isOpenLoading.value=false;
    presentToast("Errore");
    console.error('Errore durante il recupero dell\'ID del negozio:', error);
    return null;
  }

}


async function salvaOrari() {
  isOpenLoading.value=true;

  const idDocumentNegozio= await recuperaIDNegozioPerUID();

  try {
    isOpenLoading.value=true;

    const ref = doc(db, "Negozi", idDocumentNegozio);

  // Converti la mappa in un oggetto con array di orari
  const orariObject = {};
  orariSalvati.forEach((valore, chiave) => {
    orariObject[chiave] = valore;
  });

  // Esegui l'operazione di aggiornamento del documento con l'oggetto
  await updateDoc(ref, {
    orariLavorativi: orariObject
  });

  presentToast("Orari Aggiornati salvati con successo");
  isOpenLoading.value=false;


  } catch (error) {
    presentToast("Errore");
    isOpenLoading.value=false;
  }
  
}


</script>


<style scoped>

.button-orario{
  margin-top: 0px;
}
.div-nome-giorni {
  display: flex;
}
.button-selezionato {
  --color: "warning";
}


.div-nome-giorno {
  border: 1px solid #ccc;
  width: 14.28%;
  text-align: center;

}
.div-nome-giorni {
  flex-direction: row;
}


.div-orari {
  display: flex;
}

.div-colonna-orari {
  display: flex;
  flex: auto;
  flex-direction: column;
  overflow-y: scroll;
  max-height: 500px;
  border: 1px solid #ccc;
}

</style>
