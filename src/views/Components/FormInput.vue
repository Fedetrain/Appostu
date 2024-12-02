<!-- FormInput.vue (componente figlio) -->
<template>
    <div>
      <ion-item class="form-input">
        <ion-input :label="label" :type="inputType" label-placement="floating" :placeholder="placeholder" @ionInput="inputChanged" :value="value" :readonly="readonly"  autocapitalize= "sentences"
        ></ion-input>
      </ion-item>
    </div>
  </template>
  
  <script setup>
  import { defineProps, defineEmits } from 'vue';
  import { IonInput,IonItem } from '@ionic/vue';
  
  const props = defineProps(['inputType', 'label', 'placeholder','value','readonly']);
  const emits = defineEmits(['update']);
  
  const inputChanged = (event) => {
    console.log('Valore inserito:', event.target.value);
    emits('update', event.target.value);
  };
  </script>
  
  <style scoped>
.form-input {
    border: 3px solid var(--ion-color-secondary); /* Colore del bordo con il colore secondario */
    border-radius: 6px;
    margin: 5px;
}

  </style>
  