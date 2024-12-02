<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="tab1gestore" href="/gestore/tabs/tab1gestore">
          <ion-icon aria-hidden="true" :icon="homeOutline" />
          <ion-label>Home</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2gestore" href="/gestore/tabs/tab2gestore">
          <ion-icon aria-hidden="true" :icon="calendarOutline" />
          <ion-label>Prenotazioni</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3gestore" href="/gestore/tabs/tab3gestore">
          <ion-icon aria-hidden="true" :icon="personOutline" />
          <ion-label>Profilo</ion-label>
        </ion-tab-button>
      </ion-tab-bar>

      <!-- Alert che appare quando l'utente rifiuta le notifiche -->


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
import { ref, onMounted,onUnmounted } from 'vue';
import { IonToast,toastController,IonPopover, IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet, IonFab, IonFabButton, IonItem, IonInput, IonButton, IonAlert } from '@ionic/vue';
import { homeOutline, calendarOutline, personOutline, chatbubbleSharp } from 'ionicons/icons';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getAuth } from "firebase/auth";
import { App } from '@capacitor/app';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();



const mostraPopover = ref(false);
const segnalazione = ref('');
const db = getFirestore();
const showAlert = ref(false); // Stato per il controllo dell'alert
const showRationale = ref(false); // Stato per mostrare la finestra di rationale
let backButtonPressedOnce = false; // Variabile per tracciare il primo tocco
const exitAppTimeout = ref(null); // Timer per il reset


async function presentToast(message) {
  const toast = await toastController.create({
    message: message,
    duration: 2000,
  });

  await toast.present();
}

// Gestione popover
const togglePopover = () => {
  mostraPopover.value = !mostraPopover.value;
};

// Funzione per inviare una segnalazione
const inviaSegnalazione = async () => {
  if (segnalazione.value == '') {
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

// Funzione per aggiornare il token di notifica
const updateNotificationToken = async (token) => {
  console.log("updatenotification gestore")
  try {
    const user = getAuth().currentUser;
    if (!user) {
      console.log("User not logged in");
      return;
    }
    const userId = user.uid;

    const userDocRef = doc(db, "Gestore", userId);

    await setDoc(userDocRef, {
      notificationToken: token // Aggiungi o aggiorna il campo 'notificationToken'
    }, { merge: true });

    console.log("Token updated successfully with merge");
  } catch (error) {
    console.error("Error updating token: ", error);
  }
};

const requestNotificationPermission = () => {

  PushNotifications.requestPermissions().then((result) => {
    if (result.receive === 'granted') {
      PushNotifications.register();
    } else {
      console.log('Permission not granted for push notifications');
      showRationale.value = true;
    }
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
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
            },
          ],
        });
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Notification action performed: ', notification);
  });  

  PushNotifications.addListener('registration', (token) => {
    console.log('Push registration success, token: ', token.value);
    updateNotificationToken(token.value)
  });
  
};

// Ciclo di vita onMounted
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

  requestNotificationPermission()
  
  
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
