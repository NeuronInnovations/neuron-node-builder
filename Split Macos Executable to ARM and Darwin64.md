# Split Macos Executable to ARM and Darwin64

- compile wrapper into ARM
- Place into wrapper release so that names match
- Split account.neuron.world mac button into two
  - one ARM
  - one Darwin 64
- Create a process that creates 3 neuron-node-builder-releases or manually place them in the release of neuron-node-builder
- Update account.neuron.world "auto version fetcher" to work with the new names
