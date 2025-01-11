<template>
  <div class="notification-bubble">
    
    <div class="notification-body" v-html="formattedMailBody"></div>
    <div class="back-button" @click="goBack()">
      &lt; Back
    </div>
    <div class="created-at">
      Sent at: {{ formattedDate }}
    </div>
  </div>
</template>

<script>
export default {
  name: "NotificationContents",
  props: {
    mailBody: String,
    createdAt: String,
  },
  computed: {
    formattedDate() {
      const date = new Date(this.createdAt);
      return date.toLocaleString();
    },
    formattedMailBody() {
      if (!this.mailBody) return "No content available.";

      const normalizedBody = this.mailBody.replace(/\s+/g, ' ').trim();
      console.log("Normalized MAIL BODY:", normalizedBody);

      const sentences = normalizedBody
        .split(/(?<=\.)\s+/)
        .filter(sentence => sentence.trim() !== "");

      console.log(sentences);

      let dentist = '';
      let specialization = '';
      let date = '';
      let formattedBody = '';

      sentences.forEach(sentence => {
        //console.log("Processing sentence:A", sentence);
        
        if (sentence.includes("Dentist:")) {
          const dentistMatch = sentence.match(/Appointment: Dentist:\s*(.*?)(?=\s*Specialization:|$)/);
          if (dentistMatch) {
            //console.log("Match!!!", dentistMatch)

            dentist = dentistMatch[1].trim();
          }
        }

        if (sentence.includes("Specialization:")) {
          const specializationMatch = sentence.match(/Specialization:\s*(.*?)(?=\s*Date:|$)/);
          if (specializationMatch) {
            //console.log("Match!!!", specializationMatch)


            specialization = specializationMatch[1].trim();
          }
        }
        if (sentence.includes("Date:")) {
          const dateMatch = sentence.match(/Date:\s*(.*?)(?=\s*\.)/);
          if (dateMatch) {
            //console.log("Match!!!", dateMatch)

            date = dateMatch[1].trim();
          }
        } 


        if (dentist && specialization && date) {
          //console.log("dentist", dentist, specialization, date)
          formattedBody += `
            <strong>Appointment Details:</strong><br>
            <strong>Dentist:</strong> ${dentist}<br>
            <strong>Specialization:</strong> ${specialization}<br>
            <strong>Date:</strong> ${date}<br><br>
          `;
          dentist = '';
          specialization = '';
          date = '';
        } else {
          if (!sentence.includes("Appointment:") && !sentence.includes("Specialization:") && !sentence.includes("Date:")) {
        formattedBody += sentence + "<br><br>";
      }
        }
      });

      console.log(formattedBody)

      return formattedBody;
    },
  },
  methods: {
    goBack() {
      this.$emit('go-back');
    },
  },
};
</script>

<style scoped>
.notification-bubble {
  background-color: #e8f4fa;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  white-space: normal;
  width: calc(100% - 40px);
  margin: 0 auto;
  max-width: 100%;
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column; 

}

.notification-body {
  font-size: 1.2rem;
  margin-bottom: 10px;
}

.created-at {
  text-align: right;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 30px;
}

.back-button {
  position: absolute;
  bottom: 10px; 
  right: 10px;
  background-color: white;
  color: #5581af;
  border: 1px solid #5581af;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  align-self: flex-end;
}
.back-button:hover {
  background-color: #f0f0f0;
}

</style>
