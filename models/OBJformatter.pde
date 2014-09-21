import java.text.DecimalFormat;


PrintWriter writer;

void setup() {

  writer = createWriter("data/brain_vertex_low.obj");
  
  String lines[] = loadStrings("brain_vertex.obj");
  
  DecimalFormat df = new DecimalFormat("0.00");
  
  for (int i = 0 ; i < lines.length; i++) {
    
    String readLine = lines[i];
    
    boolean isVertex = (readLine.charAt(0) == 'v');
    if (isVertex) {
      
      String outputLine = "v";
      
      String[] tokens = splitTokens(lines[i]);
      for (int j=1; j<tokens.length; j++) {
        String formattedValue = df.format(float(tokens[j]));
        outputLine = outputLine + " " + formattedValue;
      }
      
      writer.println(outputLine);
    } else {
      writer.println(readLine);
    }
    
  }
  
  writer.flush();
  writer.close();
  exit();
  
}
