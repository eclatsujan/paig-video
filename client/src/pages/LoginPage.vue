<template>
  <div class="login">
      <div class="container">
          <login-component v-if="username===''" @onSubmit="login"></login-component>
          <chat-component v-else></chat-component>
      </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import LoginComponent from '../components/LoginComponent.vue';
import ChatComponent from '../components/ChatComponent.vue';
export default defineComponent({
  name: 'LoginPage',
  props: {
    msg: String,
  },
  components: {
    LoginComponent,
    ChatComponent
  },
  data:function(){
    return {
      username:""
    }
  },
  methods: {
    login: function(username:string){
        this.username = username;
    }
  }
  
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
