import Vision
import CoreImage
import Foundation

// uso: cutdir <carpeta_entrada> <carpeta_salida> — recorta el primer plano de cada PNG
let args = CommandLine.arguments
let fm = FileManager.default
let ctx = CIContext()
let files = try fm.contentsOfDirectory(atPath: args[1]).filter { $0.hasSuffix(".png") }.sorted()
for name in files {
    let input = CIImage(contentsOf: URL(fileURLWithPath: args[1] + "/" + name))!
    let handler = VNImageRequestHandler(ciImage: input)
    let req = VNGenerateForegroundInstanceMaskRequest()
    try handler.perform([req])
    guard let obs = req.results?.first else { print("sin primer plano:", name); continue }
    let buf = try obs.generateMaskedImage(ofInstances: obs.allInstances, from: handler, croppedToInstancesExtent: false)
    try ctx.writePNGRepresentation(of: CIImage(cvPixelBuffer: buf), to: URL(fileURLWithPath: args[2] + "/" + name), format: .RGBA8, colorSpace: CGColorSpaceCreateDeviceRGB())
}
print("hecho:", files.count)
