export const themes = [
  {
    id: "reservoir",
    number: "01",
    title: "Reservoir computing",
    subtitle: "Memory in motion",
    description:
      "How can a fixed dynamical system turn a stream of observations into a useful representation? Reservoir computing connects nonlinear dynamics with efficient learning.",
    math: String.raw`\mathbf{x}_{t+1}=(1-\alpha)\mathbf{x}_t+\alpha\tanh(W\mathbf{x}_t+W_{\mathrm{in}}\mathbf{u}_t)`,
    caption:
      "An illustrative leaky echo-state update; α controls the memory timescale.",
    image: "/images/network.svg",
  },
  {
    id: "dynamics",
    number: "02",
    title: "Dynamics & synchronization",
    subtitle: "Finding a common rhythm",
    description:
      "Coupled systems can organize into shared patterns. This theme explores nonlinear evolution, collective behavior, and the conditions under which rhythms align.",
    math: String.raw`\dot{\theta}_i=\omega_i+\frac{K}{N}\sum_{j=1}^{N}\sin(\theta_j-\theta_i)`,
    caption:
      "The Kuramoto model illustrates phase synchronization in coupled oscillators.",
    image: "/images/orbits.svg",
  },
  {
    id: "networks",
    number: "03",
    title: "Network structure & geometry",
    subtitle: "The shape of connection",
    description:
      "A network is more than a list of links. Its topology and geometry can shape signal propagation, stability, and the information a system can retain.",
    math: String.raw`L=D-A,\qquad L\mathbf{v}_k=\lambda_k\mathbf{v}_k`,
    caption: "The graph Laplacian links connectivity to spectral structure.",
    image: "/images/network.svg",
  },
  {
    id: "forecasting",
    number: "04",
    title: "Forecasting & machine learning",
    subtitle: "Patterns beyond the present",
    description:
      "Time-series forecasting asks what the past can tell us about the future, while respecting uncertainty, sensitivity, and the limits of predictability.",
    math: String.raw`\widehat{\mathbf{y}}_{t+\tau}=f_{\theta}(\mathbf{u}_{t},\mathbf{u}_{t-1},\ldots)`,
    caption:
      "A general forecast map with horizon τ; this is a conceptual model.",
    image: "/images/waves.svg",
  },
];
