<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary" >
        <ion-title>Profilo</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="div-button">
        <!-- Pulsante per visualizzare il profilo -->
        <ion-button class="button" router-link="/cliente/tabs/tab3/visualizzaProfilo" router-direction="forward">
          Visualizza profilo
        </ion-button>

        <!-- Pulsante di logout con icona -->
        <ion-button class="button-logout" @click="logout">
          Logout
          <ion-icon slot="end" :icon="logOutOutline"></ion-icon>
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon } from '@ionic/vue';
import { getAuth, signOut } from "firebase/auth";
import { logOutOutline } from "ionicons/icons";
import { useRouter } from 'vue-router';

const router = useRouter();
const auth = getAuth();

const logout = async () => {
  try {
    await signOut(auth);
    router.replace('/login');
  } catch (error) {
    console.error("Errore durante il logout:", error);
  }
};
</script>

<style scoped>
  /* Stili per il layout e i pulsanti */
  .div-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .button,
  .button-logout {
    margin-top: 20px;
    width: 80%;
    max-width: 300px;
    height: 50px;
    font-weight: bold;

    transition: background-color 0.3s, box-shadow 0.3s;
  }



  /* Stile per l'icona di logout */
  .button-logout ion-icon {
    font-size: 1.2rem;
    margin-left: 8px;
  }
</style>
