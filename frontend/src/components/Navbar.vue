<template>
  <b-navbar toggleable="lg" class="navbar-custom justify-content-end">
    <b-navbar-brand to="/" href="#">DentistDirect</b-navbar-brand>
    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
    <b-collapse id="nav-collapse" is-nav>
      <b-navbar-nav class="ml-auto">
        <b-nav-item to="/Login">Login</b-nav-item>
          <b-nav-item to="/slots" :active-class="active-tab">Available Slots</b-nav-item>
        <b-nav-item to="/signup">Sign Up</b-nav-item>
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>
</template>
