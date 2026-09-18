import Vision
import CoreImage
import AppKit
// uso: mask <entrada> <salida-mascara.png>
let a = CommandLine.arguments
let img = CIImage(contentsOf: URL(fileURLWithPath: a[1]))!
let req = VNGenerateForegroundInstanceMaskRequest()
let h = VNImageRequestHandler(ciImage: img)
try h.perform([req])
guard let r = req.results?.first else { print("sin objeto"); exit(1) }
let buf = try r.generateScaledMaskForImage(forInstances: r.allInstances, from: h)
let ci = CIImage(cvPixelBuffer: buf)
let rep = NSBitmapImageRep(ciImage: ci)
try rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: a[2]))
