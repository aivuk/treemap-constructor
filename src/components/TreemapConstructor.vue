<template>
  <div class="treemap-constructor">
    <div class="datapackage">
      <div class="datapackage-loader container">
        <b-field label="Datapackage">
          <b-input v-model="datapackage">
          </b-input>
          <a class="button" @click="getModel()">Load datapackage</a>
        </b-field>
      </div>
      <div class="config" v-if="hasModel">
        <div class="hierarchies">
          <h1>Hierarchies</h1>
          <a class="button" v-for="hierarchy in this.model.hierarchies" @click="selectHierarchy(hierarchy)">{{hierarchy['label']}}</a>
        </div>
        <div class="measures">
          <h1>Aggregates</h1>
          <a class="button" @click="selectMeasure(aggregate)" :class="{'is-primary': aggregate['ref'] === config['value']}" v-for="aggregate in this.model.aggregates" v-if="aggregate['function'] == 'sum'">{{aggregate['label']}}</a>
        </div>
      </div>
    </div>
    <div class="treemap-preview" v-if="showTreemap">
      <treemap @v-on:update="updateData()" :datapackage="datapackage" apiurl="https://openspending.org/api/3/cubes/" :config="config"></treemap>
    </div>
  </div>
</template>

<script>
import { treemap } from 'dpvis'
import * as axios from 'axios'
import 'dpvis/dist/lib/dpvis.min.css'

export default {
  name: 'treemap-constructor',
  components: { treemap },
  data () {
    return {
      apiurl: 'https://openspending.org/api/3/cubes/',
      datapackage: 'a6a16b964a7e784f99adecc47f26318a:berlin_16_17_clean',
      hasModel: false,
      showTreemap: false,
      config: {'hierarchies': [], 'value': '', 'filters': {}},
      model: {},
      update: false
    }
  },
  methods: {
    emptyConfig: function () {
      return Object.keys(this.config).length === 0
    },
    selectHierarchy: function (hierarchy) {
      var hasHierarchy = this.config['hierarchies'].find(h => h['label'] === hierarchy['label'])
      if (!hasHierarchy) {
        this.config['hierarchies'].push({
          'datapackageHierarchy': hierarchy['ref'],
          'url': hierarchy['ref'],
          'label': hierarchy['label']
        })
      }

      console.log(this.config, JSON.stringify(this.config, null, 2))
      this.showTreemap = true
    },
    selectMeasure: function (measure) {
      this.config['value'] = measure['ref']
      console.log(this.config, JSON.stringify(this.config, null, 2))
    },
    getModel: function () {
      if (this.datapackage) {
        var apiRequestUrl = `${this.apiurl}${this.datapackage}/model/`
        axios.get(apiRequestUrl).then(response => {
          this.model = response.data.model
          this.hasModel = true

          // Find aggregate of type 'sum'
          var sumAggregate = {}
          var aggregateKeys = Object.keys(this.model.aggregates)
          for (var i in aggregateKeys) {
            var key = aggregateKeys[i]
            if (this.model.aggregates[key]['function'] === 'sum') {
              sumAggregate = this.model.aggregates[key]['ref']
              break
            }
          }

          if (sumAggregate) {
            this.config['value'] = sumAggregate
          }
        })
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
h1, h2 {
  font-weight: normal;
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

#treemap {
   width: 1200px;
}
</style>
