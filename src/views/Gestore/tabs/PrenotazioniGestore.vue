<template>
<ion-page>
    <ion-header>
    <ion-toolbar color="primary"  >
        <ion-title>Prenotazioni</ion-title>
        <ion-loading
          :is-open="isOpenLoading"
          message="Please wait...">
        </ion-loading>
    </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
        <div class="div-navigazione-mese">
          <ion-button @click="spostaMese(-1)" class="button-avanti-indietro">Indietro</ion-button>
          <p class="mese-titolo">{{ nomeMese }}</p>
          <ion-button @click="spostaMese(1)" class="button-avanti-indietro" >Avanti</ion-button>
          <ion-badge  color="warning" @click="mostraPopoverFunction()">
          Hai {{ numNuovePrenotazioni }} nuove prenotazioni
        </ion-badge>
        </div>

        <div class="div-contenitore-giorni" ref="contenitoreGiorni">
          <div 
            class="div-giorno"
            v-for="(giorno, index) in giorniArray"
            :key="index"
            @click="clickGiorno(giorno)"
            :class="{ 'giorno-selezionato': dataSelezionata.getDate() === giorno.numeroGiorno }">
            {{ giorno.nomeGiornoSettimana }} {{ giorno.numeroGiorno}}
          </div>
        </div>

        <div v-if="finito">
            
            <div v-for="(oggettoOrario, index) in setOggettiOrario" :key="index" class="div-contenitore-orario" @click="presentAlert( oggettoOrario.oraInizio,oggettoOrario.prenotato,oggettoOrario.prenotazione)">
                <div  :class="{'div-orario': oggettoOrario.prenotato==false,'div-orario-prenotato': oggettoOrario.prenotato==true}">
                    {{ oggettoOrario.oraInizio}} / {{ incrementaOrario(oggettoOrario.oraInizio, 15) }}

                </div>

                <div class="div-informazioni-prenotazione">
                    <div v-if="oggettoOrario.prenotato">{{ oggettoOrario.nomeCliente }}</div>
                    <div style="font-size:small ;" v-if="oggettoOrario.prenotato" >{{ oggettoOrario.sceltaUtente }}</div>
                </div>
                <ion-badge v-if="oggettoOrario.new" color="warning">New</ion-badge>

            </div>
        </div>
    </ion-content>

    <ion-popover :is-open="mostraPopover" @ionPopoverDidDismiss="mostraPopover = false">
        <div class="popover-content">
            <h3>Nuove Prenotazioni</h3>
            <ul>
            <li v-for="(prenotazione, index) in nuovePrenotazioni" :key="index" class="prenotazione-item">
                <div class="prenotazione-details">
                    <strong>
                        Data: {{ formatDate(prenotazione.dataPrenotazione) }}
                    </strong><br>
                <span>{{ prenotazione.nomeCliente }} {{ prenotazione.cognomeCliente }}</span><br>
                <span>Servizio: {{ prenotazione.servizioSelezionato }}</span>
                </div>
            </li>
            </ul>
        </div>
        </ion-popover>


    <AlertInformazioniPrenotazione 
      :is-open="isModalOpen" :prenotazioneSelected="prenotazioneSelected" @close-modal="closeModal" @ricarica-orari="ricaricaOrari"></AlertInformazioniPrenotazione>
    </ion-page>

</template>
<style scoped>

.popover-content {
  padding: 16px;
  font-family: Arial, sans-serif;
}

.prenotazione-item {
  margin-bottom: 12px;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.prenotazione-details {
  font-size: 14px;
  color: #333;
}

.div-contenitore-giorni {
display: flex;
overflow: scroll;
}
.div-contenitore-orario{
    display: flex;
    align-items: center;
    box-shadow: 0 2px 4px var(--ion-color-secondary);
    border-radius: 10px;
    margin-top: 10px;
    justify-content: stretch;
    align-content: stretch;
}

.div-orario {
    border-radius: 10px;
    display: flex;
    align-items: center;
    padding: 5px;
    background-color: yellowgreen;
    min-height: 50px;
    font-size: small;
    text-align: center;

}
.div-giorno {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: 5px;
  text-align: center;
  min-height: 50px;
  cursor: pointer;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 4px var(--ion-color-secondary);
  transition: background-color 0.3s ease;
}
.giorno-selezionato {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: var(--ion-color-secondary);
  margin: 5px;
  text-align: center;
  min-height: 50px;
  cursor: pointer;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease;
}

.div-orario-prenotato {
    border-radius: 10px;
    display: flex;
    padding: 5px;
    align-items: center;
    font-size: small;
    background-color: rgb(205, 50, 50);
    min-height: 50px;
    text-align: center;

}
.div-navigazione-mese{
  margin-top: 10px;
  display: flex;
  flex-direction: row;
  justify-content: left;
  align-items:flex-start;
  
}
.mese-titolo {
  font-size: x-large;
  font-weight: bold;
  margin-top: 0px;
}
.div-informazioni-prenotazione{
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 70%;
    
}
.button-avanti-indietro{
    margin-top: 0px;
  width: 15%;
  font-size: x-small;
  height: min-content;
}


</style>




<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { getFirestore, collection, where, getDocs, query, addDoc, doc, updateDoc } from 'firebase/firestore';
import { IonLoading,IonPopover,onIonViewDidEnter, alertController,IonPage,IonContent,IonButton,IonHeader,IonToolbar,IonTitle,IonBadge,modalController} from '@ionic/vue';
import { getAuth, reauthenticateWithPhoneNumber } from "firebase/auth";
import BackButton from '/src/views/Components/BackButton.vue';
import AlertInformazioniPrenotazione from '/src/views/Components/AlertInformazioniPrenotazione.vue';

const store = useStore();
const db = getFirestore();
const router = useRouter();
const auth = getAuth();
const isOpenLoading = ref(false);

let dataSelezionata = reactive(new Date());
let giorniArray = reactive([]);
let orariMap = reactive(new Map());
let orariPerGiorno = reactive(new Set());
let prenotazioni = reactive(new Set());
let finito = ref(false);
const contenitoreGiorni = ref(null);
let nomeMese = ref('');
const setOggettiOrario = reactive(new Set());

var mostraPopover=ref(false)



const idDocumentNegozio = store.getters.getIdDocumentNegozioGestore;
const prenotazioneSelected = ref("");
var nuovePrenotazioni = ref([]);
var numNuovePrenotazioni = ref(0);



const { isModalOpen, openModal, closeModal } = {
  isModalOpen: ref(false),
  openModal: () => isModalOpen.value = true,
  closeModal: () => isModalOpen.value = false
};


function mostraPopoverFunction(){
    mostraPopover.value=true

}


async function ricaricaOrari(){
    await recuperaPrenotazioni();

}

const presentAlert = async (oraInizio, prenotato, prenotazione) => {
    if (prenotato) {
        prenotazioneSelected.value = prenotazione;
        
        // Aggiorna il documento della prenotazione
        const prenotazioneRef = doc(db, "Prenotazioni", prenotazione.id); // Assicurati di avere l'ID del documento
        await updateDoc(prenotazioneRef, {
            new : false // Imposta il campo 'nuovo' a false
        });
        
        console.log("Prenotazione aggiornata, campo 'nuovo' impostato a false.");
        
        openModal(); // Apri il modal dopo aver aggiornato
        console.log("prenotato aperto modal");
    } else {
        const alertButtons = [
            {
                text: 'Annulla',
                cssClass: 'alert-button-cancel',
            },
            {
                text: 'Conferma',
                cssClass: 'alert-button-confirm',
                handler: async (data) => {
                    const nomeCliente = data[0];
                    const sceltaUtente = data[1];
                    await inserisciPrenotazione(nomeCliente, sceltaUtente, oraInizio, 15);
                },
            },
        ];

        const alertInputs = [
            {
                type: 'textarea',
                placeholder: 'Inserisci il nome del cliente',
            },
            {
                type: 'textarea',
                placeholder: 'Inserisci eventuale descrizione',
            },
        ];

        const alert = await alertController.create({
            header: 'Inserisci manualmente la prenotazione',
            buttons: alertButtons,
            inputs: alertInputs,
        });

        await alert.present();
    }
};

function calcolaGiorniMese(dataSelezionata) {
    const mese = dataSelezionata.getMonth();
    const anno = dataSelezionata.getFullYear();
    const dataInizioMese = new Date(anno, mese, 1);
    const dataFineMese = new Date(anno, mese + 1, 0);
    const dateArray = [];

    while (dataInizioMese <= dataFineMese) {
        const nomeGiornoSettimana = new Intl.DateTimeFormat('it-IT', { weekday: 'long' }).format(dataInizioMese);
        const oggettoGiorno = {
            nomeGiornoSettimana: nomeGiornoSettimana.charAt(0).toUpperCase() + nomeGiornoSettimana.slice(1),
            numeroGiorno: dataInizioMese.getDate(),
        };
        dateArray.push(oggettoGiorno);
        dataInizioMese.setDate(dataInizioMese.getDate() + 1);
    }

    return dateArray;
}

async function recuperaTuttiOrariLavorativi() {

    try {
        isOpenLoading.value=true
        const uiduser = auth.currentUser.uid;
        const q = query(collection(db, "Negozi"), where("proprietarioUid", "==", uiduser));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const orariObject = doc.data().orariLavorativi;
            orariMap = new Map(Object.entries(orariObject));
            console.log("orariMap", orariMap);

            orariMap.forEach((orariGiorno, giorno) => {
                orariMap.set(giorno, orariGiorno.sort(confrontaOrari));
            });

            prendiOrariPergiorno(creaOggettoGiorno(dataSelezionata));
        } else {
            console.error('Nessun documento trovato con uiduser');
        }
        isOpenLoading.value=false

    } catch (error) {
        isOpenLoading.value=false

        console.error('Errore durante il recupero degli orari:', error);
    }
}

function confrontaOrari(orario1, orario2) {
    const [ore1, minuti1] = orario1.split(':').map(Number);
    const [ore2, minuti2] = orario2.split(':').map(Number);
    return ore1 !== ore2 ? ore1 - ore2 : minuti1 - minuti2;
}

function prendiOrariPergiorno(giorno) {
    console.log('Funzione prendiOrariPergiorno chiamata con il giorno:', giorno);

    orariPerGiorno.clear();
    console.log('orariPerGiorno è stato svuotato.');

    const nomeGiornoSettimana = giorno.nomeGiornoSettimana;
    console.log('Nome del giorno della settimana:', nomeGiornoSettimana);

    orariMap.forEach((valore, chiave) => {
        if (chiave == nomeGiornoSettimana) {
            console.log(`Trovato ${chiave} nella mappa degli orari con valori:`, valore);
            valore.forEach(ora => {
                console.log(`Aggiungendo ora ${ora} per il giorno ${nomeGiornoSettimana}`);
                orariPerGiorno.add(ora);
            });
        }
    });

    console.log(`Orari per il giorno ${nomeGiornoSettimana}:`, Array.from(orariPerGiorno));
}
function creaOggettoGiorno(data) {
    const nomeGiornoSettimana = new Intl.DateTimeFormat('it-IT', { weekday: 'long' }).format(data);
    const oggettoGiorno = {
        nomeGiornoSettimana: nomeGiornoSettimana.charAt(0).toUpperCase() + nomeGiornoSettimana.slice(1),
        numeroGiorno: data.getDate(),
    };
    console.log(oggettoGiorno);
    return oggettoGiorno;
}


async function recuperaPrenotazioni() {
    try {
        isOpenLoading.value=true

        prenotazioni.clear();        
        nuovePrenotazioni.value = [];
        console.log("Prenotazioni precedenti cancellate.");

        // Definisci la query per recuperare le prenotazioni
        const q = query(
            collection(db, "Prenotazioni"), 
            where("idDocumentNegozio", "==", idDocumentNegozio),
            where("dataPrenotazione", ">=", dataSelezionata),
            where("dataPrenotazione", "<", new Date(dataSelezionata.getTime() + 24 * 60 * 60 * 1000))
        );

        const query2 = query(
            collection(db, "Prenotazioni"), 
            where("idDocumentNegozio", "==", idDocumentNegozio),
        );

        console.log("Esecuzione della query per recuperare tutte le prenotazioni.");
        const querySnapshot2 = await getDocs(query2);
        console.log(`Trovate ${querySnapshot2.size} prenotazioni totali.`);

        // Cicla i documenti ottenuti e aggiungi solo se 'new' è true
        querySnapshot2.forEach(async (doc) => {
            const dataDocumento = doc.data();
            dataDocumento.id = doc.id;

            if (dataDocumento.new === true) {
                nuovePrenotazioni.value.push(dataDocumento);
                console.log(`Aggiunta nuova prenotazione: ${JSON.stringify(dataDocumento)}`);
            }
        });

        // Correggi qui il nome della proprietà per ottenere la lunghezza
        numNuovePrenotazioni.value = nuovePrenotazioni.value.length; // Modificato 'lenght' in 'length'
        console.log(`Numero di nuove prenotazioni: ${numNuovePrenotazioni.value}`);

        const querySnapshot = await getDocs(q);
        console.log("Query prenotazioni:", querySnapshot);

        // Cicla i documenti ottenuti e aggiungili al set reattivo prenotazioni
        querySnapshot.forEach(async (doc) => {
            const dataDocumento = doc.data();
            dataDocumento.id = doc.id;
            prenotazioni.add(dataDocumento);
            console.log(`Aggiunta prenotazione al set: ${JSON.stringify(dataDocumento)}`);
        });

        // Chiamata alla funzione per creare il set delle prenotazioni
        creaSetPrenotazioni(prenotazioni, orariPerGiorno);
        console.log("Set delle prenotazioni creato.");
        
        finito.value = true;
        isOpenLoading.value=false

        console.log("Operazione completata con successo.");
    } catch (error) {
        isOpenLoading.value=false
        console.error('Errore durante il recupero delle prenotazioni:', error);
    }
}



function creaSetPrenotazioni(prenotazioni, orariPerGiorno) {
    console.log('Inizio creazione set oggetti orario.');

    setOggettiOrario.clear();

    for (const orarioGiorno of orariPerGiorno) {
        console.log(`Verifica orario: ${orarioGiorno}`);

        const prenotazioneCorrispondente = Array.from(prenotazioni).find(prenot => prenot.oraInizio == orarioGiorno);

        if (prenotazioneCorrispondente) {
            console.log(`Trovata prenotazione per orario ${orarioGiorno}:`, prenotazioneCorrispondente);
            prenotaOrariConsecutivi(prenotazioneCorrispondente);
        } else {
            console.log(`Nessuna prenotazione trovata per orario ${orarioGiorno}. Creazione nuovo oggetto orario.`);

            const oggettoOrario = {
                prenotato: false,
                oraInizio: orarioGiorno,
                sceltaUtente: '',
                nomeCliente: '',
                prenotazione: "",
            };

            if (!isOrarioPresente(oggettoOrario.oraInizio)) {
                setOggettiOrario.add(oggettoOrario);
                console.log(`Orario ${orarioGiorno} aggiunto a setOggettiOrario.`);
            } else {
                console.log(`Orario ${orarioGiorno} già presente in setOggettiOrario.`);
            }
        }
    }

    console.log('Set oggetti orario creato:', Array.from(setOggettiOrario));

}


function prenotaOrariConsecutivi(prenotazioneCorrispondente) {
    const durata = prenotazioneCorrispondente.durataServizioSelezionato;
    console.log('durata', durata);
    const numeroSlot = durata / 15;

    for (let i = 0; i < numeroSlot; i++) {
        const orario = aggiungiMinuti(prenotazioneCorrispondente.oraInizio, i * 15);

        const oggettoOrario = {
            prenotato: true,
            oraInizio: orario,
            sceltaUtente: prenotazioneCorrispondente.servizioSelezionato,
            nomeCliente: prenotazioneCorrispondente.nomeCliente,
            prenotazione: prenotazioneCorrispondente,
            new : prenotazioneCorrispondente.new,
        };

        if (!isOrarioPresente(oggettoOrario.oraInizio)) {
            setOggettiOrario.add(oggettoOrario);
        }
    }

    console.log('Prenotazione orari consecutivi:', Array.from(setOggettiOrario));
}

function isOrarioPresente(oraInizio) {
    return Array.from(setOggettiOrario).some(oggetto => oggetto.oraInizio === oraInizio);
}

async function inserisciPrenotazione(nomeCliente, sceltaUtente, oraInizio) {
    try {
        const nuovaPrenotazione = {
            dataPrenotazione: dataSelezionata,
            idDocumentNegozio: idDocumentNegozio,
            oraInizio: oraInizio,
            nomeCliente: nomeCliente,
            servizioSelezionato: sceltaUtente,
            durataServizioSelezionato:15,

        };

        await addDoc(collection(db, 'Prenotazioni'), nuovaPrenotazione);

        console.log('Prenotazione inserita:', nuovaPrenotazione);
        await recuperaTuttiOrariLavorativi();
        await recuperaPrenotazioni();
    } catch (error) {
        console.error('Errore durante l\'inserimento della prenotazione:', error);
    }
}



const formattaNumeroConZero = (num) => (num < 10 ? `0${num}` : num.toString());

const incrementaOrario = (orario, minuti) => {
    const [ore, minutiAttuali] = orario.split(':').map(Number);
    const nuovaData = new Date();
    nuovaData.setHours(ore);
    nuovaData.setMinutes(minutiAttuali + minuti);

    return `${formattaNumeroConZero(nuovaData.getHours())}:${formattaNumeroConZero(nuovaData.getMinutes())}`;
};

async function spostaMese(meseOffset) {
    finito.value = false;

    const nuovaData = new Date(dataSelezionata);
    nuovaData.setMonth(nuovaData.getMonth() + meseOffset);
    dataSelezionata = nuovaData;
    nomeMese = new Intl.DateTimeFormat('it-IT', { month: 'long' }).format(dataSelezionata);
    giorniArray = calcolaGiorniMese(dataSelezionata);
    await recuperaTuttiOrariLavorativi();
    await recuperaPrenotazioni();
    finito.value = true;
    scrollToIndex(dataSelezionata.getDate());
    console.log(`Mese spostato a ${nomeMese}, giorni del mese:`, giorniArray);
}

onIonViewDidEnter(async () => {
    dataSelezionata.setHours(0, 0, 0, 0);
    nomeMese = new Intl.DateTimeFormat('it-IT', { month: 'long' }).format(dataSelezionata);
    giorniArray = calcolaGiorniMese(dataSelezionata);
    await recuperaTuttiOrariLavorativi();
    await recuperaPrenotazioni();
    scrollToIndex(dataSelezionata.getDate());
    console.log('IonViewDidEnter eseguito con successo.');
});

function scrollToIndex(index) {
    if (contenitoreGiorni.value) {
        const container = contenitoreGiorni.value;
        const element = container.children[index];
        if (element) {
            const scrollLeft = element.offsetLeft - container.offsetLeft - 300;
            container.scrollLeft = scrollLeft;
            console.log(`Scroll effettuato a ${index} giorno del mese.`);
        }
    }
}

async function clickGiorno(giorno) {
    
    dataSelezionata.setDate(giorno.numeroGiorno);
    giorniArray = calcolaGiorniMese(dataSelezionata);
    await recuperaTuttiOrariLavorativi();
    await recuperaPrenotazioni();
    console.log(`Giorno ${dataSelezionata.toLocaleDateString()} cliccato.`);
}

function aggiungiMinuti(ora, minuti) {
    const [ore, minutiOra] = ora.split(':').map(Number);
    const data = new Date();
    data.setHours(ore);
    data.setMinutes(minutiOra + minuti);

    return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
}
function formatDate(timestamp) {
      // Verifica se timestamp è definito
      if (!timestamp || typeof timestamp !== 'object') {
        return "Data non valida"; // Restituisci un messaggio di errore o una stringa vuota
      }

      // Creare un oggetto Date usando seconds e nanoseconds
      const dateMilliseconds = timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000);
      const d = new Date(dateMilliseconds); // Crea un oggetto Date dal timestamp in millisecondi

      // Ottieni i componenti della data
      const day = String(d.getDate()).padStart(2, '0'); // Giorno
      const month = String(d.getMonth() + 1).padStart(2, '0'); // Mese (0-11)
      const year = d.getFullYear(); // Anno

      // Ottieni i componenti dell'ora
      const hours = String(d.getHours()).padStart(2, '0'); // Ore
      const minutes = String(d.getMinutes()).padStart(2, '0'); // Minuti

      // Restituisci la data formattata
      return `${day}/${month}/${year} ore ${hours}:${minutes}`;
    }

</script>



