export type ElementSymbol="H"|"C"|"N"|"O"|"F"|"P"|"S"|"Cl"|"Na"|"K"|"Ca"|string;
export type Atom={element:ElementSymbol;position:[number,number,number];charge?:number};
export type Bond={a:number;b:number;order?:1|2|3;type?:"covalent"|"ionic"|"aromatic"};
export type Molecule={name:string;formula:string;atoms:Atom[];bonds:Bond[];geometry?:string};

const colors:Record<string,string>={H:"#f8fafc",C:"#374151",N:"#3159c7",O:"#dc2626",F:"#22c55e",P:"#f97316",S:"#eab308",Cl:"#16a34a",Na:"#7c3aed"};
export function elementColor(symbol:string){return colors[symbol]??"#94a3b8"}
export const MOLECULES:Record<string,Molecule>={
  H2O:{name:"Agua",formula:"H2O",geometry:"angular",atoms:[{element:"O",position:[0,0,0]},{element:"H",position:[-.76,.59,0]},{element:"H",position:[.76,.59,0]}],bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1}]},
  CO2:{name:"Dióxido de carbono",formula:"CO2",geometry:"lineal",atoms:[{element:"O",position:[-1.16,0,0]},{element:"C",position:[0,0,0]},{element:"O",position:[1.16,0,0]}],bonds:[{a:0,b:1,order:2},{a:1,b:2,order:2}]},
  CH4:{name:"Metano",formula:"CH4",geometry:"tetraédrica",atoms:[{element:"C",position:[0,0,0]},{element:"H",position:[1,1,1]},{element:"H",position:[-1,-1,1]},{element:"H",position:[-1,1,-1]},{element:"H",position:[1,-1,-1]}],bonds:[{a:0,b:1},{a:0,b:2},{a:0,b:3},{a:0,b:4}]}
};
export async function buildMoleculeObject(molecule:Molecule,scale=.55){const THREE:any=await import("three/webgpu"),group=new THREE.Group();for(const atom of molecule.atoms){const mat=new THREE.MeshStandardNodeMaterial({color:elementColor(atom.element),roughness:.35}),mesh=new THREE.Mesh(new THREE.SphereGeometry(scale*(atom.element==="H"?.45:.62),48,32),mat);mesh.position.set(atom.position[0]*scale,atom.position[1]*scale,atom.position[2]*scale);group.add(mesh)}for(const bond of molecule.bonds){const a=molecule.atoms[bond.a]!,b=molecule.atoms[bond.b]!,va=new THREE.Vector3(...a.position).multiplyScalar(scale),vb=new THREE.Vector3(...b.position).multiplyScalar(scale),d=vb.clone().sub(va),len=d.length(),mid=va.clone().add(vb).multiplyScalar(.5),geo=new THREE.CylinderGeometry(.055*scale,.055*scale,len,24),mat=new THREE.MeshStandardNodeMaterial({color:0xcbd5e1,roughness:.45}),bondMesh=new THREE.Mesh(geo,mat);bondMesh.position.copy(mid);bondMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());group.add(bondMesh)}return group}
