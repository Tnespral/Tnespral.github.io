export const homeCopy = {
  title: "Hi! I’m Tiago.",
  introduction:
    "I’m a Data Science student at TU/e. I work with data and develop machine learning systems across applications such as computer vision, forecasting and NLP.",
};

export const coralCopy = {
  meta: {
    year: "October 2025",
    title: "Automating coral bleaching detection",
    repository: "https://github.com/Tnespral/coral-bleaching-vision",
  },
  introduction:
    "Reef surveys can produce thousands of underwater photographs that still have to be screened for bleaching. I built a computer vision pipeline to classify those images automatically, so routine cases can be processed quickly and ambiguous ones can be checked by a specialist.",
  colourLossCaption:
    "The same reef slope before and during the 2016 bleaching event in Moorea.",
  bleaching: {
    title: "The problem",
    background: [
      "Heat stress can cause corals to expel the symbiotic algae that provide much of their colour and energy. The pale skeleton underneath becomes visible: a useful signal in an underwater photograph, but not a diagnosis on its own.",
      "Classifying a large survey by hand is repetitive. An automated first pass can move through the collection consistently and leave ambiguous photographs for closer review.",
    ],
  },
  data: {
    title: "The data",
    paragraphs: [
      "The raw collection combined 18,630 files from eight sources. Half were exact repeats, and four rows assigned conflicting labels to the same image. After grouping by content hash and removing those conflicts, 9,313 unique, consistently labelled photographs remained: leaving us with 5,088 unbleached and 4,225 bleached images.",
      "I split the data only after duplicate grouping: 70% for training, 15% for validation and 15% for the locked test. No content hash or related image group crosses between splits, so evaluation never uses a photograph the model has effectively already seen.",
      "The sources vary in camera, resolution, lighting and colour balance. NOAA contributes 73% of the clean set, so the evaluation has to be read both overall and source by source. Otherwise a model can learn the visual style of a collection instead of the condition of the coral.",
    ],
  },
  architecture: {
    title: "The model architecture",
    introduction:
      "I used five architecture stages to estimate whether an underwater photograph contains bleached coral. The design preserves coral geometry, makes colour loss explicit, learns features that transfer across data sources and concentrates the final decision only on the relevant image regions.",
    stages: [
      {
        id: "image",
        tab: "Image",
        label: "Underwater image",
        summary: "resize + pad + augment",
        title: "Preparing a consistent input",
        body:
          "Underwater photographs arrive in different shapes and orientations, but the network needs consistent inputs for batching and stable training. Each image is orientation-corrected, scaled to fit a 224 × 224 canvas and reflect-padded instead of stretched, preserving the coral's geometry. This resolution keeps computation manageable and allows ResNet-18 to produce a 7 × 7 feature map, giving the (later on) attention-pooling layer 49 spatial cells to compare. Random flips and occasional grey-world colour correction are implemented to reduce dependence on viewpoint and camera colour cast.",
        shape: "3 × 224 × 224",
      },
      {
        id: "channels",
        tab: "RGB + saturation",
        label: "Four channels",
        summary: "texture + colour signal",
        title: "Making colour loss explicit",
        body:
          "Saturation measures the strength of colour, making it a useful signal when bleaching exposes a pale coral skeleton. I convert the prepared image to HSV, extract its saturation map and append it to RGB as a fourth channel. RGB stays on the scale used to pretrain ResNet-18, while saturation remains between 0 and 1. RGB still provides texture and structure, so the model does not rely on colour alone, as things such as sand, glare and white balance can also make regions appear pale. The extra first-layer weights begin as the mean of the pretrained RGB weights rather than starting at random.",
        shape: "4 × 224 × 224",
      },
      {
        id: "backbone",
        tab: "ResNet-18",
        label: "ResNet-18",
        summary: "features + MixStyle",
        title: "Learning transferable features",
        body:
          "ResNet-18 transforms the four-channel image into a 7 × 7 grid, where each cell contains 512 learned descriptions of edges, textures and coral structure. Starting from ImageNet weights means the model refines an existing visual vocabulary instead of learning basic image patterns from scratch. During training, MixStyle blends colour and contrast statistics between examples after two backbone stages.",
        shape: "512 × 7 × 7",
      },
      {
        id: "attention",
        tab: "Attention",
        label: "Attention pooling",
        summary: "weighted spatial evidence",
        title: "Focusing on relevant regions",
        body:
          "Global average pooling would give all 49 grid locations equal influence. Instead, two 1 × 1 convolutions score each location, and a masked softmax turns those scores into weights that sum to one, with a chosen temperature of 0.60 to make the focus more selective. The mask excludes very dark regions and a thin outer border, reducing shortcuts from empty image areas caused by some data sources which were already preprocessed. Then, a weighted sum combines the evidence into 512 features for classification. The same map also produces an attention-weighted saturation summary and an inspectable heat map.",
        shape: "512 features",
      },
      {
        id: "prediction",
        tab: "Decision",
        label: "Decision",
        summary: "predict or review",
        title: "Turning evidence into a decision",
        body:
          "One linear layer combines the 512 pooled features into a single score, then a sigmoid maps it to a probability of bleaching. Using validation predictions only, I calibrate that probability, choose the threshold that gives the best balanced accuracy and place a review band around the boundary. Clearer cases can be classified automatically, while probabilities closest to the decision boundary are withheld for specialists.",
        shape: "p(bleached)",
      },
    ],
    comparison: {
      title: "The three models",
      introduction:
        "I trained three versions, keeping the evaluation fixed to isolate the effects of the custom saturation channel and attention pooling on model performance.",
      models: [
        {
          name: "RGB baseline",
          description: "A three-channel ResNet-18 uses adaptive global average pooling before its linear classifier.",
        },
        {
          name: "RGB + saturation",
          description: "The same network and global average pooling receive saturation as an additional fourth channel.",
        },
        {
          name: "Full model",
          description: "The four-channel network adds MixStyle and replaces global averaging with learned, masked attention pooling.",
        },
      ],
      trainingNote:
        "The best validation checkpoints occurred between epochs 2 and 5. Training continued until patience expired, then restored those checkpoints. The later epochs reduced training loss without improving validation average precision.",
    },
  },
  results: {
    title: "Results",
    introduction:
      "I tested three models on the locked test set of 1,397 images. The full attention model found 545 of 636 bleached examples while correctly keeping 657 of 761 unbleached examples.",
    baseline: {
      title: "What the comparison showed",
      body:
        "The RGB baseline produced the strongest overall ranking with 0.930 average precision. The RGB + saturation model reached 0.926 AP, while the full attention model reached 0.922 AP. ROC AUC was similarly close across all three models: 0.932, 0.929 and 0.930, respectively. The full attention model achieved the strongest sensitivity to bleaching, with 85.7%.",
      observation:
        "Unbleached images were generally easier to classify than bleached images. Bright water or pale background regions can resemble the colour loss we want to detect, so attention pooling can sometimes focus on the wrong region and produce a false alarm. The harder task is avoiding missed bleaching. The full model performed best on that criterion: the saturation channel made colour loss explicit and attention pooling concentrated it spatially, raising sensitivity to 85.7% and detecting 545 of 636 bleached images. For screening, that makes the full model the most useful despite its slightly lower AP.",
    },
    limitations: {
      title: "Limitations of the data",
      body:
        "The dataset combined images from several sources with different sizes, lens types and levels of prior processing. Many photographs had already been rotated, flipped or otherwise transformed, which made duplicate detection difficult, so two files could show the same coral without matching exactly. The resolution also varied. Some were clean underwater photographs, while others were frames captured from television footage with broadcaster logos and interface graphics, or images warped into non-rectangular shapes with black borders. These features could have become shortcuts for the model instead of evidence about coral health, or noise that makes it harder to identify the key features we wanted it to identify. Discarding the sources that weren't ideal would have reduced the already limited training set too far, so the final dataset is a compromise between quality and coverage. For a model deployed within one fixed survey setup, a consistent camera and acquisition protocol would reduce source mismatch and simplify duplicate control. A model intended for broader deployment would instead need verified data from multiple cameras, sites and conditions, with those groups separated during evaluation.",
    },
  },
  credit:
    "I developed this model for the JBG060 Capstone Data Challenge at Eindhoven University of Technology. The capstone was a group project; this page and repository focus on my modelling and evaluation work.",
};

export const burglaryCopy = {
  meta: {
    year: "June 2025",
    title: "Forecasting burglary hotspots in London",
    repository: "https://github.com/Tnespral/burglary-hotspot-forecasting",
  },
  introduction:
    "Residential burglary risk is not distributed evenly across London, and the areas with the most recorded crime can change over time. Police must decide where to focus preventative patrols before the following month's reports exist, rather than responding only after crimes have been recorded. I built a forecasting system that combines the previous three months of crime with weather, housing, deprivation, population and seasonal context. It estimates the probability that each 500 m area will record a residential burglary in the following month, producing a city-wide map to support patrol planning.",
  problem: {
    title: "Forecasting one month ahead",
    body:
      "Police.uk records provide a month and an anonymised location, not an exact time or address. My first models tried to predict monthly burglary counts for large statistical areas, but most targets were zero or one. I therefore reframed the task as a spatial binary forecast: will a 500m cell record at least one residential-burglary proxy next month?",
    figureBody:
      "The same coordinate frame is used throughout, where individual reports become a binary target map, with salmon-coloured cells representing at least one recorded burglary during February 2025.",
  },
  inputs: {
    title: "One month, twelve aligned maps",
    body:
      "The source data combines burglary records with weather, housing, deprivation and population statistics. After feature engineering, each month becomes twelve 86 × 98 maps aligned to the same 6,674 valid London cells. The model is designed to be aware of three consecutive months at once when making a prediction, so every forecast is based on 36 spatial maps.",
    note:
      "I designed the calendar position of a month to be encoded as two spatially uniform channels by using sine and cosine. This places December beside January rather than at the opposite ends of a numbered scale, giving the model a better understanding of seasonal effects. The remaining ten channels vary across the London grid.",
  },
  model: {
    title: "Remembering where hotspots move",
    body:
      "Each forecast enters the model as a 3 × 12 × 86 × 98 sequence: three months, twelve channels and the London grid. A regular LSTM would flatten that grid into a list and discard which cells are neighbours. The ConvLSTM instead uses 3 × 3 convolutional gates to carry spatial memory through time, while 32 hidden maps retain patterns that persist, fade or shift nearby. A 1 × 1 decoder converts the final state into one probability per cell. The complete model has 50,849 trainable parameters.",
    loss:
      "Most valid cells have no report in a given month. Focal loss reduces the influence of easy negatives, so training spends more effort on the rarer cells where burglary was recorded.",
  },
  evaluation: {
    title: "Thirty-five forecasts without looking ahead",
    body:
      "For every test month from May 2022 to March 2025, I initialised a fresh model, trained it on the preceding twelve months, and used the immediately previous month for early stopping and threshold selection. The forecast was saved before the window moved forward, so no later month could influence an earlier result.",
    conclusion:
      "Compared with reusing the previous month's hotspots, the ConvLSTM raised recall from 59.9% to 77.5%, F1 from 0.599 to 0.657 and mean monthly ROC AUC from 0.703 to 0.832. The model therefore found substantially more true hotspot cells, at the cost of giving analysts more false alarms to review.",
    limitsTitle: "What the map can and cannot say",
    limitsBody:
      "Police.uk publishes a broad burglary category and displaced locations, while residential cases were inferred through land-use. A binary cell also treats one report and several reports alike. Recorded crime reflects reporting and policing as well as offending, which is why this map is intended for decision support for analysts rather than an instruction for automated patrol deployment.",
  },
  credit:
    "I developed the forecasting model as my contribution to a group CBL project at Eindhoven University of Technology. Contains public sector information licensed under the Open Government Licence v3.0. Source: Office for National Statistics licensed under the Open Government Licence v.3.0. Contains OS data © Crown copyright and database right 2026.",
};

export const porousCopy = {
  meta: {
    year: "April 2026",
    title: "Predicting flow fields through porous media",
    repository: "https://github.com/Tnespral/porous-media-flow",
  },
  introduction:
    "Fluid moving through a porous material is redirected by every solid boundary and narrow opening, creating a different flow value at each location. The challenge was to predict this complete spatial field from the material's geometry while keeping the model below a strict 120,000-parameter limit. I built a compact U-Net that predicts the flow at every pixel, separates known physical scaling from the learned problem, prevents flow through solid regions and produces consistent predictions for equivalent reflected or rotated geometries.",
  field: {
    title: "From geometry to a flow field",
    paragraphs: [
      "Each input is a 32 × 64 binary cross-section: open pixels allow fluid through, while closed pixels represent solid material. A pressure difference drives the fluid through the available passages, producing a different flow value at every pixel. The task is therefore to predict 2,048 spatial flow values.",
      "The dataset contained 1,500 labelled geometries and 500 hidden competition examples. Each labelled sample paired a cross-section with its pressure drop, channel length, fluid viscosity, pixel area and simulated flow field. I used 80% of the labelled data for training and 20% for validation, with a fixed seed so every model was compared on the same split.",
    ],
  },
  physics: {
    title: "Remove the physics the network already knows",
    introduction:
      "Pressure drop, pixel area, viscosity and channel length determine the overall scale of the field. Rather than asking the network to rediscover that relationship, I separated it from the part that depends on geometry.",
    scaleTitle: "Separate scale from shape",
    scaleBody:
      "I divide every target by q₀ = ΔPΔA/(μL), leaving a dimensionless field q* for the network to learn. The model can then focus on how the passages redistribute flow. Multiplying its output by q₀ restores the physical units after prediction.",
    maskTitle: "Make solid pixels impossible",
    maskBody:
      "Flow through an impermeable pixel is physically invalid. The final network output is multiplied by the binary cross-section, setting every closed location exactly to zero instead of hoping the training loss will make it approximately zero.",
    symmetryTitle: "Make equivalent geometries agree",
    symmetryBody:
      "The rectangular cross-section remains the same physical problem after a horizontal reflection, vertical reflection or 180° rotation. I evaluate those three orientations and the original with the same U-Net, return the four predictions to their starting orientation and average them. This guarantees equivariance without adding trainable parameters.",
    symmetryResult:
      "The measured mean equivariance error fell from 2.49 × 10⁻¹ for the plain U-Net to 4.24 × 10⁻⁷ after group averaging. The trade-off is four forward passes for every prediction.",
  },
  model: {
    title: "Spend the parameters on geometry",
    introduction:
      "The three-level U-Net compresses the 32 × 64 geometry to a 56-channel, 4 × 8 bottleneck, giving each prediction information from across the cross-section. The decoder then restores the original resolution while skip connections return the fine boundary detail lost during pooling.",
    detail:
      "The encoder uses 7, 14 and 28 channels before reaching the 56-channel bottleneck, and the decoder mirrors those levels on the way back to one output channel. This keeps the model at 92,450 trainable parameters, below the assignment's 120,000-parameter low-complexity limit.",
  },
  results: {
    title: "Third place on the private leaderboard",
    introduction:
      "The final model reached a private leaderboard error of 0.0005 and placed third in the competition. Its best recorded validation error was 0.000662, measured with the competition's mean absolute relative error; lower is better.",
    comparisonTitle: "What improved the model",
    comparisonBody:
      "I trained five candidate architectures for the same 300-epoch budget. The two-level U-Net reduced validation error from 0.017422 for the VGG-style encoder-decoder to 0.002895, showing the value of restoring high-resolution features through skip connections. On the smaller three-level U-Net, group averaging reduced error from 0.004823 to 0.002816 without increasing the parameter count. I selected the weight-decayed grouped model for the final staged run and retained its best checkpoint.",
    comparisonNote:
      "All five rows use the same validation split and 300-epoch comparison budget. The final leaderboard model was trained for longer.",
    predictionTitle: "What the prediction looks like",
    predictionBody:
      "The validation examples compare the input geometry, simulated target, final prediction and pixel-wise relative error. The connected case tests whether the model can recover a field-wide pattern, while the sparse case tests isolated openings and very low flow.",
  },
  limitations: {
    title: "How to read the result",
    body:
      "The 300-example holdout was used to compare architectures and select checkpoints, so it is validation data rather than an untouched test set. The private Kaggle leaderboard supplies the independent result. Exact symmetry also costs inference time because each geometry passes through the base U-Net four times.",
  },
  credit:
    "Completed as an individual project for Machine Learning in Science at Eindhoven University of Technology. The public repository is a cleaned, data-free reconstruction of the submitted implementation.",
};

export const biosensingCopy = {
  meta: {
    year: "August 2025",
    title: "Biosensing by Particle Motion",
    teamSite: "https://www.tuetest.nl/cms/",
    repository: "https://github.com/Tnespral/biosensing-particle-motion",
  },
  introduction:
    "Creatinine is a waste product filtered from the blood by the kidneys. Measuring it is widely used to assess kidney function and forms part of how acute kidney injury (AKI) is detected and monitored. The 2025 SensUs challenge was to measure creatinine continuously: repeating the measurement as new samples arrive without replacing the sensing surface or using a separate cartridge each time. Our T.E.S.T. platform approached this with a reusable flow cell and Biosensing by Particle Motion (BPM), a continuous biosensing technology developed at TU/e that measures molecular binding through changes in particle motion. I built the application and fluidics control that exchanged samples, recorded the microscope stream and converted particle motion into an inspectable bound-fraction signal.",
  principle: {
    title: "Continuous monitoring through particle motion",
    paragraphs: [
      "A continuous sensor must repeat the same measurement as new samples arrive without replacing the sensing surface or using a separate cartridge for every reading. In this prototype, a fluidic system replaces the liquid above one sensing surface with new samples while an optical system records the particles in the flow cell.",
      "Biosensing by particle motion provides the readout. A free particle explores a wider area and moves faster, and when molecular interactions constrain it near the active surface, it moves less. Across the population, that difference in motion becomes a measurable bound fraction, allowing us to estimate the concentration of creatinine in a sample.",
    ],
  },
  application: {
    title: "The code implementation",
    paragraphs: [
      "I combined acquisition, hardware control and analysis in one application. It connects to the FLIR camera and syringe pump, controls the fluidic sequence, records live microscopy or replays an existing run, and keeps the microscopy and tracking settings together with the resulting diffusion plots.",
      "During live capture, a camera worker copies each Mono8 frame into a bounded 256-frame queue while a separate writer saves the numbered TIFF sequence. This keeps the interface responsive, absorbs brief storage delays and applies back-pressure if the disk falls behind instead of allowing memory use to grow without limit.",
      "After capture, the application runs the existing particle tracker as a managed process, then starts MATLAB for post-processing in a background worker. The trajectories are drift-corrected and matched across overlapping blocks before their diffusion distributions are combined. Slower motion is treated as constrained and faster motion as free, and moving the threshold below immediately recalculates the fraction of particles assigned to the bound population.",
    ],
    calibration:
      "The concentration readout below uses a competitive-binding Hill curve fitted to the three available calibration points. It demonstrates the intended nonlinear conversion from bound fraction to creatinine concentration, but the displayed value is an extrapolation beyond the measured calibration range rather than a validated result.",
  },
  system: {
    title: "Moving and imaging each sample",
    body:
      "Each reading depends on the flow cell. The fluidics replace the sample above the sensing surface, and the optics extract an imaging sequence from the resulting particle field. The camera output is where my software takes over.",
    fluidicsTitle: "Replacing the sample without replacing the sensor",
    fluidicsBody: [
      "I built the controller for the 250 µL syringe pump and its six-port valve. The selected port determines which line the pump draws from or dispenses to, while guarded volume, speed and capacity checks prevent impossible commands and protect the pump.",
      "The tubing uses a Y-junction to separate the measurement route through the flow cell from the waste route. Each change of sample moved in more liquid than the junction and connecting tube could contain, displacing the previous sample before the next reading. We tested the carry-over strategy with dyed samples to be sure that samples were not mixing during this process.",
    ],
    opticsTitle: "Keeping the same field in view",
    opticsBody:
      "At the flow cell, the illumination and microscope objective make the particle field visible to a FLIR camera. The application supports brightfield and darkfield tracking and records the stream as a numbered Mono8 TIFF sequence. Fixed optics keep the imaging geometry consistent while the fluidics exchange the liquid above the sensor.",
  },
  result: {
    title: "Used at SensUs 2025",
    body:
      "The platform supported T.E.S.T.'s final SensUs 2025 biosensor, which won the Distributed Testing Event and Translation Potential Award and placed second for Analytical Performance.",
    awards: [
      { place: "Winner", award: "Distributed Testing Event" },
      { place: "Winner", award: "Translation Potential Award" },
      { place: "Second place", award: "Analytical Performance" },
    ],
  },
  credit:
    "Built for the 2025 T.E.S.T. biosensing project at Eindhoven University of Technology. This page focuses on my software contribution: acquisition, interface, process orchestration, post-processing and fluidics control. The application calls an existing particle-tracking executable.",
};

export const airlineCopy = {
  meta: {
    year: "June 2024",
    title: "Building an airline Twitter chatbot",
    repository: "https://github.com/Tnespral/airline-twitter-chatbot",
  },
  introduction:
    "Airline support teams receive complaints, questions, praise and unrelated mentions through the same social-media feed. A useful automated assistant must first determine which messages need attention, identify the issue and know when a person should take over. I built a first-contact prototype for British Airways' Twitter inbox that screens incoming messages with a sentiment model, routes complaints into issue categories and retrieves a prepared response. Any continuing conversation returns to the human support team.",
  data: {
    title: "Rebuilding the conversations",
    paragraphs: [
      "The raw archive contained 6,464,893 tweets and occupied 37.79 GB. We removed deleted records, retweets and redundant fields, while restoring the complete text of 1,619,077 truncated messages. The resulting MongoDB collection contained 3,587,873 tweets in 8.82 GB.",
      "Each reply stores the ID of the message it answers. A MongoDB graph lookup followed these links up to twenty levels deep, allowing us to turn the isolated records we were given back into ordered conversations.",
    ],
  },
  logic: {
    title: "Implementing two separate models",
    introduction:
      "Complaint detection and issue routing are separate decisions, so I implemented a first model to decide whether the message should enter the support flow and a second to determine what type of issue it concerns.",
    sentimentTitle: "Screen the message with RoBERTa",
    sentimentBody:
      "After comparing VADER, RoBERTa and Llama 3 (8B) for sentiment analysis, I chose CardiffNLP's Twitter RoBERTa model for the final chatbot. It combines its probabilities as P(positive) - P(negative). Only messages scoring -0.3 or lower continue, so neutral mentions and praise receive no automated reply.",
    routingTitle: "Route the complaint with BART",
    routingBody:
      "I chose BART-large-MNLI to perform zero-shot classification without a task-specific training set. My implementation first selects a broad area such as luggage, flights or service, then compares only the issue labels inside that branch. This was designed to reduce noise and turn one large label search into two smaller decisions.",
    handoffTitle: "Automate the first contact only",
    handoffBody:
      "This system is designed so that the selected issue retrieves a prepared response for cases such as missing luggage, refunds or cancellations. However, it does not generate airline policies or continue a negotiation, so any customer reply would return the conversation to the human support team.",
  },
  results: {
    title: "What the evaluation showed",
    introduction:
      "We manually labelled 530 tweets across fourteen issue categories. The prototype routed 274 correctly, giving 51.7% overall accuracy. However, this single number hides a clear pattern: concrete requests were much easier to route than broad or overlapping messages.",
    conclusion:
      "Customer-service, refund, missing-luggage and delay messages produced the strongest results. Flight-price and in-flight-amenity questions were far less distinct, while the unclassified group accounted for 175 of the 530 examples. The weakness was therefore not complaint detection; instead, the issue taxonomy needed clearer boundaries and more labelled examples.",
  },
  credit:
    "Completed as part of a DBL Data Challenge at Eindhoven University of Technology. The wider project covered data cleaning, conversation mining and airline comparison, whereas this page focuses on my work developing the complaint chatbot.",
};
