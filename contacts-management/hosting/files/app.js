// Retrieve App ID from URL
const hostname = window.location.hostname;
const res = hostname.split(".");
console.log(res[0])

const appId = res[0]; 
const appConfig = {
  id: appId, // Set Realm App ID here.
  timeout: 10000, // timeout in number of milliseconds
};

const realmApp = new Realm.App(appConfig);

async function insertContacts(contactString) {

  try {
    const contacts = JSON.parse(contactString);
    contacts.userID = realmApp.currentUser.id;
    contacts.metadata.pivot.comlinkedinsalessearchListPivotResponse = contacts.metadata.pivot['com.linkedin.sales.search.ListPivotResponse'];
    delete contacts.metadata.pivot['com.linkedin.sales.search.ListPivotResponse'];
    console.log(JSON.stringify(contacts));
    const mongo = realmApp.currentUser.mongoClient("mongodb-atlas");
    const mongoCollection = mongo.db("contacts").collection("import");
    const insertOneResult = await mongoCollection.insertOne(contacts);
    return(insertOneResult);
  } catch (e) {
    throw(e)
  } finally {
  }
}


async function loginEmailPassword(email, password) {
  // Create an anonymous credential
  const credentials = Realm.Credentials.emailPassword(email, password);
  try {
    // Authenticate the user
    const user = await realmApp.logIn(credentials);
    // `App.currentUser` updates to match the logged in user
    //assert(user.id === app.currentUser.id)
    return user
  } catch (err) {
    console.error("Failed to log in", err);
  }
}

// Vue.js Components

const RootComponent = {
  data() {
    if (realmApp.currentUser) {
      return {
        isLoggedIn: realmApp.currentUser.isLoggedIn
      }
    } else {
      return { isLoggedIn: false }
    }
  },
  methods: {
    async login() {
      this.isLoggedIn = true
    }
  }
}

const app = Vue.createApp(RootComponent);


app.component('loginForm', {
  data() {
    return {
      email: null,
      password: null,
      error: null
    }
  },
  props: ['isLoggedIn'],
  methods: {
    async handleSubmit() {
      if (this.email && this.password) {
        await loginEmailPassword(this.email, this.password).then(result => {
          if (!result.error) {
            this.$emit('login');
          } else {
            this.error = result.error;
          }
        })

      } else {
        this.error = "Form Incomplete";
      }
    }
  },
  template: `
    <form @submit.prevent="handleSubmit">
        <div class="form-group">
            <label for="loginEmail">Email</label>
            <input type="email" id="email" v-model="email" placeholder="Email Address" autocomplete="username" class="form-control">
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" v-model="password" placeholder="Password" autocomplete="current-password" class="form-control">
        </div>
        <p id="loginError" class="text-danger text-center">{{ error }}</p>
        <div class="text-right">
        <button id="loginButton" type="submit" class="btn btn-primary">Sign in</button>
        </div>
    </form>`
})


app.component('profile', {
  data() {
    return { name: realmApp.currentUser.profile.email }
  },
  methods: {
    logout() {
      realmApp.currentUser.logOut().then(result => {
        this.$root.isLoggedIn = false
      })

    }
  },
  template: `
    <p>User: {{ name }}</p>
    <div class="text-right">
    <button v-on:click="logout" class="btn btn-primary">Logout</button>
    </div>`
})


app.component('inputarea', {
  data() {
    return {
      inputArea: null,
      error: null,
      success: null
    }
  },
  methods: {
    async handleInsert() {
      console.log(this.inputArea);
      try {
        const result = await insertContacts(this.inputArea);
        this.error = "";
        console.log(result);
        this.success = result;
        this.error = "";
        this.inputArea = "";
      } catch(e){
        console.log(e);
        this.success = "";
        this.error = "Please Provide Valid JSON Structure!";
      }
    }
  },
  template: `
    <div class="container mt-3">
    <form @submit.prevent="handleInsert">
      <div class="form-group">
        <label for="inputArea"></label>
        <textarea name="inputArea" id="inputArea" v-model="inputArea" rows="3" style="min-width: 100%"></textarea>
      </div>
      <p id="insertError" class="text-danger text-center">{{ error }}</p>
      <p id="insertSuccess" class=" text-success text-center">{{ success }}</p>
      <div class="text-right">
        <button id="insertButton" type="submit" class="btn btn-primary">Insert</button>
      </div>
    </form>
    </div>`
})

const vm = app.mount('#app')


// learning https://www.vuemastery.com/courses/intro-to-vue-3/attribute-binding-vue3