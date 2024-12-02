<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-loading :is-open="isOpenLoading" message="Please wait..."></ion-loading>
        <BackButton></BackButton>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="testo-registrazione">Registrazione</div>
      <div class="form-container">
        <FormInput
          v-model="nome"
          inputType="text"
          label="Nome"
          placeholder="Inserisci il tuo nome"
          @update="nome = $event"
          autocapitalize="words"
        ></FormInput>

        <FormInput
          v-model="cognome"
          required
          inputType="text"
          label="Cognome"
          placeholder="Inserisci il tuo Cognome"
          @update="cognome = $event"
          autocapitalize="sentences"
        ></FormInput>

        <FormInput
          v-show="!isGoogleLogged"
          v-model="email"
          required
          inputType="email"
          label="Email"
          placeholder="Inserisci la tua email"
          @update="email = $event"
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


        <!-- Confirmation Password Field -->
        <div class="password-container">
          <FormInput
          class="input-container"
            :inputType="showPassword ? 'text' : 'password'"
            v-model="confirmPassword"
            required
            label="Password di conferma"
            placeholder="Inserisci nuovamente la tua password"
            @update="password = $event"
          ></FormInput>
        </div>


        <div v-if="passwordMismatch" class="error-message">
          Le password non corrispondono.
        </div>

        <FormInput
          v-model="cellulare"
          required
          inputType="number"
          label="Numero di telefono"
          placeholder="Inserisci il tuo numero di telefono"
          @update="cellulare = $event"
        ></FormInput>

        <SelectProvinciaCitta @updatecitta="aggiornaCitta" @updateprovincia="aggiornaProvincia">
        </SelectProvinciaCitta>

        <FormInput
          v-model="via"
          required
          inputType="text"
          label="Via"
          placeholder="Inserisci il tuo indirizzo di residenza"
          @update="via = $event"
          autocapitalize="sentences"
        ></FormInput>

        <FormInput
          v-model="numeroCivico"
          required
          inputType="text"
          label="Numero civico"
          placeholder="Inserisci il tuo numero civico"
          @update="numeroCivico = $event"
        ></FormInput>

        <ion-button class="register-button" @click="registerUser" expand="full" color="primary">
          Registrati
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>


.password-container{
  display: flex;
  flex-direction: row;
  align-items: center;
}
.input-container{
  flex: 25;
}
.password-icon{
  flex: 1;
}

  .register-button {
    margin-top: 20px;
  }
  .testo-registrazione{
    font-size:xx-large;
    display: flex;
    justify-content: center;
  }
  .error-message {
    color: red;
    font-size: 0.9em;
    text-align: center;
    margin-top: 5px;
  }
</style>



<script setup >
import { ref,onMounted,reactive} from 'vue';
import { useStore } from 'vuex';
import { getFirestore, collection, addDoc,doc, setDoc } from 'firebase/firestore';
import {signOut, getAuth, createUserWithEmailAndPassword,sendEmailVerification  } from "firebase/auth";
import { toastController,alertController,IonPage, IonLoading,IonIcon,IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonSelect, IonSelectOption, IonButton } from '@ionic/vue';
import { useRouter } from 'vue-router';
import BackButton from '/src/views/Components/BackButton.vue';
import FormInput from "/src/views/Components/FormInput.vue";
import SelectProvinciaCitta from "/src/views/Components/SelectProvinciaCitta.vue";
import {eyeOutline} from 'ionicons/icons';


const db = getFirestore();
const auth = getAuth();
const store = useStore();
const router= useRouter();

const isOpenLoading = ref(false);

const email = ref('');
const password = ref('');
let nome = ref('s');
const cognome = ref('');
const cellulare = ref('');
let provincia = ref('');
let citta = ref('');
const via = ref('');
const numeroCivico = ref('');
const sceltaUtente = store.getters.getSceltaUtente;

const isGoogleLogged=ref(false);
const passwordMismatch = ref(false); // State to track password match
const confirmPassword =ref('')

const showPassword = ref(false);

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};


const aggiornaProvincia = (nuovaProvincia) => {
  console.log('Aggiornamento provincia:', nuovaProvincia.value);
  provincia.value = nuovaProvincia.value;
};

const aggiornaCitta = (nuovaCitta) => {
  console.log('Aggiornamento città:', nuovaCitta.value);
  citta.value = nuovaCitta.value;
};




async function presentToast(message) {
        const toast = await toastController.create({
          message: message,
          duration: 2000,
        });

        await toast.present();
};      
const registerUser = async () => {
  if(validateRegistration()){
  isOpenLoading.value = true;

  if (!isGoogleLogged.value) {
    if (sceltaUtente=='Gestore') {
      console.log("L'utente ha scelto il ruolo di Gestore. Navigazione al componente di registrazione negozio.");

      const nuoviDati = {
        password:password.value,
        email:email.value,
        nome: nome.value,
        cognome: cognome.value,
        cellulare: cellulare.value,
        provincia: provincia.value,
        citta: citta.value,
        via: via.value,
        numeroCivico: numeroCivico.value,
      }

      store.dispatch('setDatiregistrazioneGestore',nuoviDati);
      router.push('/registrazione/registrazioneClienteGestore/registrazioneNegozio'); // Naviga al secondo component
      isOpenLoading.value = false;
    } else {
      try {
        console.log("Inizio registrazione utente:", email.value, nome.value);
        
        await createUserWithEmailAndPassword(auth, email.value, password.value)
          .then((userCredential) => {
            // L'utente è stato creato con successo
            const user = userCredential.user;
            console.log('Nuovo utente creato con UID:', user.uid);
            sendEmailVerification(userCredential.user)
              .then(async () => {
                isOpenLoading.value = false;
                console.log("Email di verifica inviata con successo all'indirizzo:", email.value);
                await registraUtenteNelDb();
              })
              .catch((error) => {
                console.error("Errore durante l'invio dell'email di verifica:", error.message);
                presentToast("Errore durante l'invio dell'email di verifica: " + error.message);
                isOpenLoading.value = false;
              });
          })
          .catch((error) => {
            // Gestisci eventuali errori durante la creazione dell'utente
            console.error("Errore durante la creazione dell'utente:", error.message);
            presentToast("Errore durante la registrazione: " + error.message);
            isOpenLoading.value = false;
          });
      } catch (error) {
        console.error("Errore durante la registrazione:", error.message);
        presentToast("Errore durante la registrazione: " + error.message);
        isOpenLoading.value = false;
      }
    }
  } else {
    console.log("L'utente ha effettuato l'accesso con Google. Procedo con la registrazione nel database.");
    await registraUtenteNelDb();
  }
  }
};




const presentAlertEmailDiVerifica = async () => {
  const alert = await alertController.create({
    header: 'Controlla la tua email',
    message: 'Premi sul link presente nella email per verificare la tua identità. Non potrai fare il login fino a quando non confermi.',
    buttons: [
      {
        text: 'OK',
        handler: () => {
          // La logica qui sarà eseguita quando l'utente preme OK
          console.log('Azione eseguita dopo aver premuto OK');
        }
      }
    ]
  });
  await alert.present();
};


const registraUtenteNelDb = async () => {


  try {
    console.log("Register, la scelta dell utente è",sceltaUtente);

    
    await setDoc(doc(db,sceltaUtente,auth.currentUser.uid), {
      email:email.value,
      nome: nome.value,
      cognome: cognome.value,
      cellulare: cellulare.value,
      provincia: provincia.value,
      citta: citta.value,
      via: via.value,
      numeroCivico: numeroCivico.value,
    });

    if(sceltaUtente=="Cliente"){
      isOpenLoading.value = false;
      presentAlertEmailDiVerifica();
      signOut(auth).then(() => {

      }).catch((error) => {
        // An error happened.
      });
      router.replace('/login'); // Naviga al secondo componente
    }else{
      isOpenLoading.value = false;
      presentAlertEmailDiVerifica();
      router.push('/registrazione/registrazioneClienteGestore/registrazioneNegozio'); // Naviga al secondo componente
    }
    console.log('Utente registrato nel database.');
  } catch (error) {
    isOpenLoading.value = false;
    console.error('Errore durante la registrazione nel database:aaaa', error.message);
    presentToast("Errore durante la registrazione "+error.message);


  }
};
const validateRegistration = () => {
  console.log("Validating registration form");

  if (
    nome.value === "" ||
    cognome.value === "" ||
    email.value === "" ||
    password.value === "" ||
    confirmPassword.value === "" || // Check if confirm password is empty
    cellulare.value === "" ||
    via.value === "" ||
    numeroCivico.value === "" ||
    provincia.value === "" ||
    citta.value === ""
  ) {
    presentToast("Completa tutti i campi");
    return false;
  }

  // Check if passwords match
  passwordMismatch.value = password.value !== confirmPassword.value;
  if (passwordMismatch.value) {
    presentToast("Le password non corrispondono");
    return false;
  }

  // Email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    presentToast("Email non valida");
    return false;
  }

  // Password complexity validation
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password.value)) {
    presentToast("La password deve contenere almeno 8 caratteri, di cui almeno una lettera maiuscola, una lettera minuscola e un numero");
    return false;
  }

  // Phone number validation
  if (cellulare.value.length < 9 || cellulare.value.length > 10) {
    presentToast("Il numero di telefono deve essere valido");
    return false;
  }

  return true;
};


onMounted(() => {
  // Controlla se l'utente è già loggato
  isOpenLoading.value=true
  const user = auth.currentUser;

  if (user) {
    // Se l'utente è loggato, compila il form con i suoi dati
    console.log('Utente già loggato:', user);
    email.value = user.email;
    isGoogleLogged.value = true; // Rendi l'email non modificabile
    password.value = 'Password123.1';
    confirmPassword.value = 'Password123.1';
     // Inserisci una stringa asterischi nel campo password
  }else{
    console.log('Utente non loggato:', user);

    isGoogleLogged.value = false; 
  }
  isOpenLoading.value=false
});

</script>


