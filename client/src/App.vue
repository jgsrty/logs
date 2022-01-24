<template>
  <HelloWorld msg="" />
  <button class="test-btn" @click="addLog">add log</button> <br />
</template>

<script>
import HelloWorld from "./components/HelloWorld.vue";

export default {
  name: "App",
  components: {
    HelloWorld,
  },
  mounted() {},
  methods: {
    addLog() {
      console.error(111)
      debugSW({ test: "fdslafjldsa" });
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.test-btn {
  font-size: 38px;
}
</style>
