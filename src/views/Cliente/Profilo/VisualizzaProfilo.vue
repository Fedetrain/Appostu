<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary"  >
        <ion-buttons slot="start">
          <BackButton></BackButton>
          <ion-loading :is-open="!finito" message="Please wait..."></ion-loading>
        </ion-buttons>
        <ion-title>Visualizza Profilo</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="form-container" v-if="finito">

        <!-- Input per Nome -->
        <FormInput
          inputType="text"
          label="Nome"
          :value="nome"
          placeholder="Inserisci il tuo Nome"
          readonly="true"
        ></FormInput>

        <!-- Input per Cognome -->
        <FormInput
          inputType="text"
          label="Cognome"
          :value="cognome"
          placeholder="Inserisci il tuo Cognome"
          readonly="true"
        ></FormInput>

        <!-- Input per Email -->
        <FormInput
          :value="email"
          required
          inputType="email"
          label="Email"
          placeholder="Inserisci la tua email"
          readonly="true"
        ></FormInput>

        <!-- Input per Password -->
        <FormInput
          value="*********"
          required
          inputType="password"
          label="Password"
          placeholder="Inserisci la tua password"
          readonly="true"
        ></FormInput>

        <!-- Input per Numero di telefono -->
        <FormInput
          :value="cellulare"
          inputType="number"
          label="Numero di telefono"
          placeholder="Inserisci il tuo numero di telefono"
          readonly="true"
        ></FormInput>

        <!-- Input per Via -->
        <FormInput
          :value="via"
          inputType="text"
          label="Via"
          placeholder="Inserisci il tuo indirizzo di residenza"
          readonly="true"
        ></FormInput>

        <!-- Input per Numero civico -->
        <FormInput
          :value="numeroCivico"
          inputType="text"
          label="Numero civico"
          placeholder="Inserisci il tuo numero civico"
          readonly="true"
        ></FormInput>

        <!-- Pulsante Modifica Email -->
        <ion-button @click="modificaEmail"  color="primary" class="custom-button">
          Modifica Email
        </ion-button>

        <!-- Pulsante Modifica Password -->
        <ion-button @click="modificaPassword"  color="primary" class="custom-button">
          Modifica Password
        </ion-button>

      </div>
    </ion-content>
  </ion-page>
</template>
    
    <script setup>
    import { ref, onMounted } from 'vue';
    import { useStore } from 'vuex';
    import { useRouter } from 'vue-router';
    import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
    import { getAuth, updateEmail as updateFirebaseEmail, updatePassword as updateFirebasePassword } from 'firebase/auth';
    import {
        IonPage,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonButton,
        IonButtons,
        IonLoading,
    } from '@ionic/vue';
    import BackButton from '/src/views/Components/BackButton.vue';
    import FormInput from '/src/views/Components/FormInput.vue';
    import SelectProvinciaCitta from '/src/views/Components/SelectProvinciaCitta.vue';
    const isOpenLoading = ref(false);
    let finito= ref(false);

    
    const store = useStore();
    const db = getFirestore();
    const router = useRouter();
    const auth = getAuth();
    
    
    let nome = ref('wddwdwd');
    const cognome = ref('');
    const email = ref('');
    const password = ref('');
    const cellulare = ref('');
    let provincia = ref('');
    let citta = ref('');
    const via = ref('');
    const numeroCivico = ref('');
    
    
    const modificaEmail = async () => {
        const nuovaEmail = prompt('Inserisci la nuova email:');
        if (nuovaEmail) {
        try {
            await updateFirebaseEmail(auth.currentUser, nuovaEmail);
            await updateDoc(doc(db, 'Cliente', uid), { email: nuovaEmail });
            await updateDoc(doc(db, 'Gestore', uid), { email: nuovaEmail });
            email.value = nuovaEmail;
            console.log('Email modificata con successo.');
        } catch (error) {
            console.error('Errore nella modifica dell\'email:', error.message);
        }
        }
    };
    
    const modificaPassword = async () => {
        const nuovaPassword = prompt('Inserisci la nuova password:');
        if (nuovaPassword) {
        try {
            await updateFirebasePassword(auth.currentUser, nuovaPassword);
            console.log('Password modificata con successo.');
        } catch (error) {
            console.error('Errore nella modifica della password:', error.message);
        }
        }
    };
    
    async function recuperaInformazioniUtente(userUid) {

    const clienteDocRef = doc(db, 'Cliente', userUid);
    const gestoreDocRef = doc(db, 'Gestore', userUid);

    try {
        const clienteDocSnapshot = await getDoc(clienteDocRef);
        const gestoreDocSnapshot = await getDoc(gestoreDocRef);

        if (clienteDocSnapshot.exists()) {
            const data = clienteDocSnapshot.data();
            console.log('Dati Cliente:', data);
            nome.value = data.nome;
            cognome.value = data.cognome;
            email.value = data.email;
            cellulare.value = data.cellulare;
            provincia.value = data.provincia;
            citta.value = data.citta;
            via.value = data.via;
            numeroCivico.value = data.numeroCivico.toString();

            isOpenLoading.value= false;
            finito.value = true;


            console.log('Valori delle variabili:', nome.value, cognome.value, email.value, cellulare.value, provincia.value, citta.value, via.value, numeroCivico.value);
        } else if (gestoreDocSnapshot.exists()) {
            const data = gestoreDocSnapshot.data();
            console.log('Dati Gestore:', data);
            nome.value = data.nome;
            cognome.value = data.cognome;
            email.value = data.email;
            cellulare.value = data.cellulare;
            provincia.value = data.provincia;
            citta.value = data.citta;
            via.value = data.via;
            numeroCivico.value = data.numeroCivico;

            isOpenLoading.value= false;
            finito.value = true;

            console.log('Valori delle variabili:', nome.value, cognome.value, email.value, cellulare.value, provincia.value, citta.value, via.value, numeroCivico.value);
        } else {
            console.log('Il documento non esiste in Cliente né in Gestori');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Errore durante il recupero del documento:', error);
        return false;
    }
}

onMounted(async () => {
    isOpenLoading.value= true;

    const uid=auth.currentUser.uid;
    const recuperoRiuscito = await recuperaInformazioniUtente(uid);
    if (recuperoRiuscito) {
        console.log('Recupero delle informazioni utente completato con successo.');
    } else {
        console.log('Recupero delle informazioni utente non riuscito.');
    }
});
</script>
    
<style scoped>
.custom-button{
    border-radius: 10px;
}
</style>
  