// Import function triggers from their respective submodules
const {onDocumentCreated, onDocumentDeleted}=
require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();

// Funzione per inviare una notifica quando una prenotazione viene aggiunta
exports.onPrenotazioneCreated = onDocumentCreated(
    "Prenotazioni/{prenotazioneId}",
    async (snap, context) => {
      const newPrenotazione2 = snap.data.data();
      console.log(newPrenotazione2);

      const proprietarioUid = newPrenotazione2.proprietarioUid;

      try {
        // Recupera il token di notifica dell'utente dalla collection "Cliente"
        const userDocRef = admin.firestore().collection("Gestore")
            .doc(proprietarioUid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
          console.log("User document not found");
          return null;
        }

        const notificationToken = userDoc.data().notificationToken;

        if (!notificationToken) {
          console.log("No notification token found for user");
          return null;
        }
        console.log("toke", notificationToken);

        const date = newPrenotazione2.dataPrenotazione;
        console.log("data prenotazione", date);

        const seconds = date.seconds;
        const nanoseconds = date.nanoseconds;
        const milliseconds =
        (seconds * 1000) + Math.floor(nanoseconds / 1000000);
        const dateObj = new Date(milliseconds);
        dateObj.setHours(dateObj.getHours() + 1 );

        console.log("data prenotazione oggetto data", dateObj);


        // Formatta la data in italiano(es. "11 novembre 2024")
        const formattedDate = dateObj.toLocaleDateString("it-IT", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        // Formatta l'ora in italiano senza fuso orario (es. "17:00:00")
        const formattedTime = dateObj.toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        // Unisci data e ora formattate
        const formattedDateTime = `${formattedDate} ore ${formattedTime}`;
        console.log("formatted data", formattedDateTime);
        const nomeCliente= newPrenotazione2.nomeCliente;

        const servizioSelezionato = newPrenotazione2.servizioSelezionato;
        const body = `${nomeCliente} ha prenotato
${servizioSelezionato}`;
        const title = `Nuova Prenotazione: ${formattedDateTime} `;

        const pushMessage = {
          token: notificationToken,
          notification: {
            title: title,
            body: body,
          },
        };
        // Invia la notifica push al dispositivo dell'utente
        const response = await admin.messaging()
            .send(pushMessage);
        console.log("Notification sent successfully:", response);
        return null;
      } catch (error) {
        console.error("Error sending notification:", error);
        return null;
      }
    },
);

exports.onPrenotazioneDeleted = onDocumentDeleted(
    "Prenotazioni/{prenotazioneId}",
    async (snap, context) => {
      const deletedPrenotazione = snap.data.data();
      console.log(deletedPrenotazione);

      const proprietarioUid = deletedPrenotazione.idDocumentCliente;

      try {
        const userDocRef = admin.firestore().collection("Cliente")
            .doc(proprietarioUid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
          console.log("User document not found");
          return null;
        }

        const notificationToken = userDoc.data().notificationToken;

        if (!notificationToken) {
          console.log("No notification token found for user");
          return null;
        }
        console.log("Token", notificationToken);

        const date = deletedPrenotazione.dataPrenotazione;
        console.log("Data prenotazione eliminata", date);

        const seconds = date.seconds;
        const nanoseconds = date.nanoseconds;
        const milliseconds =
          (seconds * 1000) + Math.floor(nanoseconds / 1000000);
        const dateObj = new Date(milliseconds);

        console.log("Data prenotazione oggetto data", dateObj);

        // Formatta la data in italiano (es. "11 novembre 2024")
        const formattedDate = dateObj.toLocaleDateString("it-IT", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        // Formatta l'ora in italiano senza fuso orario (es. "17:00:00")
        const formattedTime = dateObj.toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        // Unisci data e ora formattate
        const formattedDateTime = `${formattedDate} ore ${formattedTime}`;
        console.log("Formatted data", formattedDateTime);

        const servizioSelezionato = deletedPrenotazione.servizioSelezionato;
        const body = `La prenotazione per 
${servizioSelezionato} è stata cancellata dal gestore`;

        const title = `Prenotazione Cancellata: 
${formattedDateTime}`;

        const pushMessage = {
          token: notificationToken,
          notification: {
            title: title,
            body: body,
          },
        };

        // Invia la notifica push al dispositivo dell'utente
        const response = await admin.messaging()
            .send(pushMessage);
        console.log("Notification sent successfully:", response);
        return null;
      } catch (error) {
        console.error("Error sending notification:", error);
        return null;
      }
    },
);

