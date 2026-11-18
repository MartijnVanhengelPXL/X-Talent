<script setup>
import data from '../data/portfolio.json'

/** Het verplichte overzicht van alle activiteiten, in de vorm van een vertrekbord. */
const jaren = data.jaren.map((j) => ({
  ...j,
  rijen: j.stations.flatMap((s) => s.activiteiten.map((a) => ({ ...a, domein: s.domein }))),
}))
</script>

<template>
  <section id="overzicht" class="overview" aria-labelledby="overzicht-titel">
    <div class="overview__inner">
      <h2 id="overzicht-titel">Alle activiteiten</h2>
      <p class="overview__lead">
        Alles wat ik voor X-Talent deed, per jaar. In de rit hierboven vertel ik meer over projectweek, de hackathon en Duitsland.
      </p>

      <div v-for="j in jaren" :key="j.id" class="timetable">
        <h3>
          <span>{{ j.label }}</span>
          <span class="timetable__year">{{ j.schooljaar }}</span>
        </h3>
        <div class="timetable__scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Activiteit</th>
                <th scope="col">Domein</th>
                <th scope="col">Omschrijving</th>
                <th scope="col">Locatie</th>
                <th scope="col">Datum</th>
                <th scope="col">Duur</th>
                <th scope="col">Zelf aangebracht</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in j.rijen" :key="a.titel">
                <th scope="row">{{ a.titel }}</th>
                <td data-label="Domein">{{ a.domein }}</td>
                <td data-label="Omschrijving">{{ a.omschrijving }}</td>
                <td data-label="Locatie">{{ a.locatie }}</td>
                <td data-label="Datum" class="num">{{ a.datum }}</td>
                <td data-label="Duur">{{ a.duur }}</td>
                <td data-label="Zelf aangebracht">{{ a.zelf ? 'Ja' : 'Nee' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>
