<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Login</ion-title>
        <ion-loading :is-open="isOpenLoading" message="Please wait..."></ion-loading>
      </ion-toolbar>
    </ion-header>



    <ion-content class="ion-padding">


      <div class="login-container">
        <FormInput
          v-model="email"
          required
          inputType="email"
          label="Email"
          placeholder="Inserisci la tua email"
          @update="email=$event"
        ></FormInput>


        <div class="password-container">

            <FormInput
            class="input-container"
              :inputType="showPassword ? 'text' : 'password'"
              v-model="password"
              required
              label="Password"
              placeholder="Inserisci la tua password"
              @update="password = $event"
            ></FormInput>
            <ion-icon
              :icon="eyeOutline"
              @click="togglePasswordVisibility"
              class="password-icon"
            ></ion-icon>
        </div>
          
        </div>

        <ion-button class="login-button" @click="loginButtonClick" color="primary">Accedi</ion-button>
        <ion-button class="register-button" @click="registratiButtonClick" color="secondary">Registrati</ion-button>
        <p class="forgot-password" @click="presentAlertPasswordDimenticata()">Password dimenticata?</p>

        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="google-login" @click="signInWithGoogle1()">
          <ion-icon :icon="logoGoogle"></ion-icon>
          <p>Accedi con Google</p>
        </div>
    </ion-content>
  </ion-page>
</template>




<script setup >
import { Capacitor } from '@capacitor/core';

import { ref,onMounted, onUnmounted,} from "vue";
import { signInWithRedirect,signInWithCredential,signInWithCustomToken,getAuth,sendPasswordResetEmail,signInWithEmailAndPassword,GoogleAuthProvider,signOut,sendEmailVerification,createUserWithEmailAndPassword} from "firebase/auth";
import { useRouter } from 'vue-router';
import { getFirestore, doc, setDoc ,collection,addDoc,getDoc,getDocs,query,where} from 'firebase/firestore';
import { logoGoogle,eyeOutline, planet} from 'ionicons/icons';
import {toastController,alertController,IonToast,IonLoading, IonPage, IonHeader,IonTitle, IonToolbar, IonContent, IonItem, IonInput, IonButton,IonIcon, isPlatform } from '@ionic/vue';
import FormInput from "/src/views/Components/FormInput.vue";
import { AdMob,BannerAdPosition,BannerAdSize } from "@capacitor-community/admob";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';


const isOpenLoading = ref(false);
const router = useRouter();

const db = getFirestore();
const provider = new GoogleAuthProvider();
const email = ref("");
const password = ref("");
const error = ref(null);
const auth = getAuth();
const showPassword = ref(false);

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};



const signInWithGoogle1 = async () => {
  try {
    
    // Effettua il login con Google usando Capacitor
    const googleUser = await GoogleAuth.signIn();
    console.log("Accesso a Google eseguito con successo");
    console.log("google user", googleUser);

    // Estrai l'ID Token (necessario per Firebase)
    const idToken = googleUser.authentication.idToken;
    console.log("ID Token di Google:", idToken);

    // Crea una credenziale di Firebase usando l'ID Token di Google
    const credential = GoogleAuthProvider.credential(idToken);

    // Esegui l'accesso su Firebase con la credenziale
    const firebaseUser = await signInWithCredential(auth, credential);
    console.log("Accesso a Firebase eseguito con successo:", firebaseUser.user);

  } catch (error) {
    console.error('Errore durante il login (o creazione) dell\'utente con Google:', error);
  }
};





onMounted(() => {
  isOpenLoading.value=true

   const platform = Capacitor.getPlatform();
  console.log("platform",platform)

  if (platform === 'web') {
    // Configurazione per la piattaforma web
    GoogleAuth.initialize({
      clientId: '175265749386-07c82f8tcdmgltsbilki0fnnspaam1tj.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
    });

    console.log("GoogleAuth inizializzato per Web",GoogleAuth);
    
  } else if (platform === 'ios') {
    // Configurazione per la piattaforma iOS
    GoogleAuth.initialize({
      clientId: '175265749386-j707k56685qvrn37bqllhala7gig0imp.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
    console.log("GoogleAuth inizializzato per iOS");

  } else if (platform === 'android') {
    
    // Configurazione per la piattaforma Android
    GoogleAuth.initialize({
      clientId: '175265749386-07c82f8tcdmgltsbilki0fnnspaam1tj.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
    console.log("GoogleAuth inizializzato per Android");

  } else {
    console.warn("Piattaforma non supportata per GoogleAuth");
  } 
});


async function initialize() {
    console.log("Inizio dell'inizializzazione di AdMob...");
  
    // Controlla lo stato di autorizzazione del tracking
    try {
      const status = await AdMob.trackingAuthorizationStatus();
      console.log("Stato AdMob:", status);
    } catch (error) {
      console.error("Errore nel controllo dello stato di autorizzazione del tracking:", error);
    }
  
    // Inizializza AdMob
    try {
      await AdMob.initialize({
        requestTrackingAuthorization: true,
        initializeForTesting: true, // Questo dovrebbe essere true solo in fase di test
      });
      console.log("AdMob inizializzato con successo.");
    } catch (error) {
      console.error("Errore durante l'inizializzazione di AdMob:", error);
      return; // Ferma l'esecuzione se l'inizializzazione fallisce
    }
  
    // Opzioni per l'annuncio banner
    const bannerOptions = {
      adId: 'ca-app-pub-9010134003844365/9069352640', // ID di test per AdMob
      adSize: BannerAdSize.BANNER,
      position: 'top',
    };
  
    // Aggiungi listener per gestire l'errore di caricamento
    AdMob.addListener('onAdFailedToLoad', (error) => {
      console.error("Errore nel caricamento dell'annuncio:", error);
    });
  
    // Mostra il banner
    try {
      console.log("Tentativo di mostrare l'annuncio banner...");
      await AdMob.showBanner(bannerOptions);
      console.log("Annuncio banner mostrato con successo.");
    } catch (error) {
      console.error("Errore durante la visualizzazione del banner:", error);
    }
  }
  






const loginButtonClick = async () => {
  isOpenLoading.value = true;

  console.log('Inizio login con email e password');
  console.log(`Email: ${email.value}, Password: ${password.value}`);

  signInWithEmailAndPassword(auth, email.value, password.value)
    .then(async (userCredential) => {
      if (userCredential.user) {
        console.log('Login riuscito:', userCredential.user);

        if (userCredential.user.emailVerified) {
          console.log('Email verificata. Procedi con il recupero dei dati.');

          const uid = userCredential.user.uid;
          await checkIfDocumentExists(uid);
        } else {
          console.log('Email non verificata. Mostra l\'alert e disconnetti l\'utente.');
          presentAlertEmailDiVerifica();
          isOpenLoading.value = false;
        }
      } else {
        console.log('Utente non loggato');
        isOpenLoading.value = false;
      }
    })
    .catch((error) => {
      isOpenLoading.value = false;
      console.error('Errore durante il login:', error);
      presentToast("Email o password errate");
    });
};

const registratiButtonClick = () => {
  router.push('/registrazione/sceltaUtilizzoRegistrazione');

};

async function presentToast(message) {
  const toast = await toastController.create({
    message: message,
    duration: 2000,
  });

  await toast.present();
}

const presentAlertEmailDiVerifica = async () => {
  const alert = await alertController.create({
    header: 'Controlla la tua email',
    message: 'Premi sul link presente nella email per verificare la tua identità. Non potrai fare il login fino a quando non confermi.',
    buttons: [
      {
        text: 'OK',
        handler: () => {
          console.log('Azione eseguita dopo aver premuto OK');
        }
      },
      {
        text: 'Invia di nuovo',
        handler: () => {
          console.log('Azione eseguita dopo aver premuto "Invia di nuovo"');
          sendEmailVerification(auth.currentUser)
            .then(() => {
              presentToast('Email di verifica inviata di nuovo');
            });
        }
      }
    ]
  });

  await alert.present();
};

const presentAlertPasswordDimenticata = async () => {
  const alert = await alertController.create({
    header: 'Password Dimenticata',
    message: 'Inserisci la tua email, ti invieremo una email per reimpostare la tua password',
    inputs: [
      {
        name: 'emailr',
        type: 'email',
        placeholder: 'Inserisci la tua email'
      }
    ],
    buttons: [
      {
        text: 'Annulla',
        role: 'cancel',
        handler: () => {
          console.log('Azione eseguita dopo aver premuto Annulla');
        }
      },
      {
        text: 'Invia email',
        handler: async (alertData) => {
          const emailInput = alertData.emailr;

          if (emailInput) {
            try {
              console.log(`Inizio invio email per reimpostare la password a: ${emailInput}`);
              await sendPasswordResetEmail(auth, emailInput);
              console.log('Email inviata con successo!');
              presentToast('Email inviata con successo');
            } catch (error) {
              console.error('Errore durante l\'invio dell\'email per reimpostare la password:', error);
              presentToast('Errore durante l\'invio dell\'email per reimpostare la password');
            }
          } else {
            console.log('L\'utente non ha inserito un indirizzo email');
            presentToast('Inserisci un indirizzo email valido');
          }
        }
      }
    ]
  });

  await alert.present();
};

const logout = async () => {
  signOut(auth).then(() => {
    router.push('/login');
  }).catch((error) => {
    console.error('Errore durante il logout:', error);
  });
};


const checkIfNegozioIsAccettato = async (proprietarioUid) => {
  try {
    // Prepara una query per cercare nella collection "Negozi" il campo "proprietarioUid"
    const q = query(collection(db, 'Negozi'), where('proprietarioUid', '==', proprietarioUid));
    
    // Esegui la query e ottieni i documenti corrispondenti
    const querySnapshot = await getDocs(q);
    
    // Se trovi almeno un documento
    if (!querySnapshot.empty) {
          console.log('Negozio accettato, spostamento verso /gestore/tabs.');
          return true

    } else {
      console.log('Negozio non presente.');
      alert('Il tuo negozio non è ancora stato accettato. Attendi che venga accettato.');
      return false

    }
  } catch (error) {
    console.error('Errore nel controllare la collection:', error);
    return false

  }
};

async function checkIfDocumentExists(userUid) {
  const clienteDocRef = doc(db, "Cliente", userUid);
  const gestoreDocRef = doc(db, "Gestore", userUid);

  try {
    const clienteDocSnapshot = await getDoc(clienteDocRef);
    const gestoreDocSnapshot = await getDoc(gestoreDocRef);

    if (auth.currentUser.email === "federico.traina01@gmail.com") {
      router.push('/admin');

    } else if (clienteDocSnapshot.exists()) {
      router.replace('/cliente/tabs');

    } else if (gestoreDocSnapshot.exists()) {

       var isAccettato= await checkIfNegozioIsAccettato(gestoreDocSnapshot.id);
       if(isAccettato){
      router.replace('/gestore/tabs'); // Sposta l'utente verso la pagina del gestore
       }

      
    } else {
      router.push('/registrazione/sceltaUtilizzoRegistrazione');
    }
  } catch (error) {
    console.error('Errore durante il recupero del documento:', error);
    presentToast("Errore durante il recupero dei dati.");
  } finally {
  }
}


auth.onAuthStateChanged(async user => {
  if (user) {
    if (user.emailVerified) {
      await checkIfDocumentExists(user.uid);
    } else {
      presentAlertEmailDiVerifica();
    }
  } else {
    console.log('Nessun utente loggato');
    router.push('/login');
  }
  isOpenLoading.value= false
  //SplashScreen.hide();

  });
//initialize()
</script>

<style scoped>


.password-container{
  z-index: 0;
  display: flex;
  flex-direction: column;
}
.password-icon{
  margin-left: 3%;
}
.login-container {
  max-width: 400px;
  margin: auto;
  padding: 2px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.input-item {
  margin-bottom: 15px;
}

.login-button,
.register-button {
  width: 100%;
  margin-top: 15px;
}

.forgot-password {
  color: #3498db;
  cursor: pointer;
  margin-top: 10px;
}

.error-message {
  color: #e74c3c;
  margin-top: 10px;
}

.google-login {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #dd4b39;
  color: #fff;
  border-radius: 4px;
  padding: 10px;
  cursor: pointer;
  margin-top: 20px;
}

.google-login  {
  margin-right: 10px;
}
</style>

