<template>
  <ion-page>
    <ion-tabs class="tab-bar">
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="tab1" href="/cliente/tabs/tab1">
          <ion-icon  :icon="homeOutline" />
          <ion-label>Home</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="/cliente/tabs/tab2">
          <ion-icon :icon="calendarOutline" />
          <ion-label>Prenotazioni</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3" href="/cliente/tabs/tab3">
          <ion-icon  :icon="personOutline" />
          <ion-label>Profilo</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
      <ion-alert
      :is-open="showAlert"
      header="Permessi notifiche"
      message="Hai rifiutato le notifiche. Non potrai ricevere aggiornamenti importanti."
      buttons="OK"
      @didDismiss="showAlert = false"
    />

    <!-- Alert per rationale -->
    <ion-alert
      :is-open="showRationale"
      header="Importanza delle notifiche"
      message="Le notifiche sono molto importanti perché ti permettono di ricevere comunicazioni riguardo le tue prenotazioni. Vuoi attivare le notifiche ora?"
      :buttons="[
        { text: 'Annulla', role: 'cancel', handler: () => showRationale = false },
        { text: 'Attiva', handler: requestNotificationPermission }
      ]"
    />
      <!-- Popover per i contatti -->
      <ion-popover :is-open="mostraPopover" @ionPopoverDidDismiss="mostraPopover = false">
        <div class="popover-content">
          <h3 class="popover-title">📞 Area Contatti</h3>
          <p class="popover-description">
            La nostra app è in via di sviluppo e saremo lieti di accogliere qualsiasi segnalazione.
          </p>
          <ion-item>
            <ion-label position="stacked">Segnalazione</ion-label>
            <ion-input v-model="segnalazione" placeholder="Scrivi qui la tua segnalazione" clear-input></ion-input>
          </ion-item>
          <ion-button expand="full" @click="inviaSegnalazione" class="submit-button">
            Invia Segnalazione
          </ion-button>
        </div>
      </ion-popover>
    </ion-tabs>
    <ion-fab class="custom-fab" vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="togglePopover">
          <ion-icon aria-hidden="true" :icon="chatbubbleSharp" />
        </ion-fab-button>
      </ion-fab>
  </ion-page>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import {IonAlert, IonPopover, IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet, IonFab, IonFabButton, IonItem, IonInput, IonButton } from '@ionic/vue';
import { homeOutline, calendarOutline, personOutline, chatbubbleSharp } from 'ionicons/icons';
import { getFirestore, collection, addDoc,doc,setDoc } from 'firebase/firestore';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';

import { getAuth} from "firebase/auth";




const db = getFirestore();

// Stato reattivo per il popover e la segnalazione
const mostraPopover = ref(false);
const segnalazione = ref('');
const showAlert = ref(false); // Stato per il controllo dell'alert
const showRationale = ref(false); // Stato per il controllo dell'alert
let backButtonPressedOnce = false; // Variabile per tracciare il primo tocco
const exitAppTimeout = ref(null); // Timer per il reset




// Funzione per aprire/chiudere il popover
function togglePopover() {
  mostraPopover.value = !mostraPopover.value;
}


const requestNotificationPermission = () => {

  LocalNotifications.requestPermissions().then((result) => {
    if (result.receive === 'granted') {
      PushNotifications.register();
    } else {
      console.log('Permission not granted for push notifications');
      showRationale.value = true;
    }
  });

  LocalNotifications.addListener('pushNotificationReceived', (notification) => {
    const notificationId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
    console.log('Notification received: ', notification);
        LocalNotifications.schedule({
          notifications: [
            {
              id: notificationId,
              title: notification.title,
              body: notification.body,
              schedule: { at: new Date(Date.now() + 1000) }, // Mostra dopo 1 secondo
              sound: 'default', // Suono di default
              smallIcon: "icon_notification", // Nome del file icona per Android

            },
          ],
        });
  });

  LocalNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Notification action performed: ', notification);
  });  

  LocalNotifications.addListener('registration', (token) => {
    console.log('Push registration success, token: ', token.value);
    updateNotificationToken(token.value)
  });
};



// Funzione per inviare la segnalazione
const inviaSegnalazione = async () => {
  if (segnalazione.value=='') {
    alert('Per favore, scrivi una segnalazione prima di inviare.'); // Messaggio di errore semplice
    return;
  }
  try {
    // Salva la segnalazione nel database
    await addDoc(collection(db, "Segnalazioni"), {
      messaggio: segnalazione.value,
      data: new Date().toISOString(), // Salva la data in formato ISO
    });
    alert('Segnalazione inviata con successo!'); // Messaggio di conferma
    segnalazione.value = ''; // Pulisci il campo di input
    mostraPopover.value = false; // Chiudi il popover
  } catch (error) {
    console.error('Errore durante l\'invio della segnalazione:', error);
    alert('Si è verificato un errore. Riprova più tardi.');
  }
};

const updateNotificationToken = async (token) => {
  console.log("updatenotification cliente")

  try {
    // Ottieni l'ID dell'utente (user.uid)
    const user = getAuth().currentUser;
    if (!user) {
      console.log("User not logged in");
      return;
    }
    const userId = user.uid;

    // Riferimento al documento dell'utente nella collection "clienti"
    const userDocRef = doc(db, "Cliente", userId);

    // Unisci il nuovo token al documento esistente senza sovrascrivere gli altri campi
    await setDoc(userDocRef, {
      notificationToken: token // Aggiungi o aggiorna il campo 'notificationToken'
    }, { merge: true });  // L'opzione merge evita di sovrascrivere il documento

    console.log("Token updated successfully with merge");
  } catch (error) {
    console.error("Error updating token: ", error);
  }
};




onMounted(async () => {

  App.addListener('backButton', async () => {
      if (backButtonPressedOnce) {
        App.exitApp();
      } else {
        backButtonPressedOnce = true;
        presentToast("Premi di nuovo indietro per uscire dall'app");

        exitAppTimeout.value = setTimeout(() => {
          backButtonPressedOnce = false;
        }, 2000);
      }
  });
  try {
    // Controlla lo stato corrente dei permessi
    const status = await LocalNotifications.checkPermissions();

    if (status.display === 'granted') {
      return
    } /* else if (status.display === 'denied') {
      console.warn('Notifiche disabilitate. Indirizzo l\'utente alle impostazioni.');
      alert('Le notifiche sono disabilitate. Abilitarle nelle impostazioni del dispositivo.');

      await App.openAppSettings(); */
      else {
      console.log('Richiedo i permessi per le notifiche...');
      showRationale.value=true
    }
  } catch (error) {
    console.error('Errore durante il controllo o la richiesta di permessi:', error);
  }  
});
    
</script>

<style scoped>
.popover-content {
  padding: 20px;
  font-family: Arial, sans-serif;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.popover-title {
  color: #3880ff; /* Colore del titolo */
  font-size: 1.5em; /* Dimensione del font */
  margin-bottom: 10px; /* Margine sotto il titolo */
}

.popover-description {
  margin-bottom: 16px; /* Margine sotto la descrizione */
}

ion-item {
  margin-bottom: 16px;
}

.submit-button {
  background-color: #3880ff; /* Colore del bottone */
  color: white; /* Colore del testo */
}

.submit-button:hover {
  background-color: #3171e2; /* Colore del bottone al passaggio del mouse */
}

.custom-fab {
  margin-bottom: 60px; /* Regola questo valore in base alle tue necessità */
}
</style>
