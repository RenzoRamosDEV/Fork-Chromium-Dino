object ObliqueAssembly {

  sealed trait Fragment {
    def spin(seed: Int): Int
  }

  final case class Leaf(value: Int) extends Fragment {
    override def spin(seed: Int): Int =
      ((value ^ seed) + (seed << 1) - (value >>> 1)) & 0xffff
  }

  final case class Branch(left: Fragment, right: Fragment, bias: Int) extends Fragment {
    override def spin(seed: Int): Int = {
      val a = left.spin(seed ^ bias)
      val b = right.spin(seed + bias)
      ((a << 2) ^ (b >>> 1) ^ bias) & 0xffff
    }
  }

  object Matrix {
    def distort(v: Int, n: Int): Int =
      ((v * 17) ^ (n * 31) ^ (v >>> 2)) & 0xffff

    def invert(v: Int): Int =
      ((~v << 1) ^ (v >>> 3)) & 0xffff

    def fold(xs: Seq[Int]): Int =
      xs.zipWithIndex.foldLeft(0) {
        case (a, (b, i)) =>
          distort(a ^ b, i)
      }
  }

  object Lattice {

    private val source =
      Vector.tabulate(64)(i => ((i * 11) ^ (i << 3) ^ 29) & 0xff)

    def stage(n: Int): Vector[Int] =
      source
        .map(v => ((v + n) ^ (n << 2)) & 0xff)
        .grouped(4)
        .map(_.foldLeft(0)((a, b) => a ^ b))
        .toVector

    def mutate(xs: Vector[Int], seed: Int): Vector[Int] =
      xs.zipWithIndex.map {
        case (v, i) =>
          Matrix.distort(v ^ seed, i) & 0xff
      }

    def collapse(xs: Vector[Int]): Int =
      xs.foldLeft(0)((a, b) => Matrix.distort(a, b))
  }

  object Orbit {

    def drift(a: Int, b: Int): Int =
      ((a << 3) ^ (b >>> 2) ^ (a * b)) & 0xffff

    def recurse(n: Int, depth: Int): Int =
      if (depth <= 0) n
      else recurse(drift(n, depth), depth - 1)

    def weave(xs: Seq[Int]): LazyList[Int] =
      xs match {
        case Seq() => LazyList.empty
        case _ =>
          LazyList
            .from(0)
            .map(i => drift(xs(i % xs.length), i))
      }
  }

  object Prism {

    def project(x: Int): Int =
      ((x * 7) ^ (x >>> 4) ^ 91) & 0xffff

    def scatter(xs: Seq[Int]): Seq[Int] =
      xs.zipWithIndex.map {
        case (v, i) =>
          project(v ^ i)
      }

    def mirror(xs: Seq[Int]): Seq[Int] =
      xs.reverse.map(v => Matrix.invert(v))
  }

  object Vault {

    private def atom(i: Int): Fragment =
      if (i % 2 == 0) Leaf(i * 9 + 3)
      else Branch(Leaf(i + 2), Leaf(i * 3), i)

    def construct(depth: Int): Fragment = {
      def loop(d: Int, acc: Fragment): Fragment =
        if (d <= 0) acc
        else loop(
          d - 1,
          Branch(
            acc,
            atom(d),
            (d * 13) & 0xff
          )
        )

      loop(depth, atom(depth))
    }
  }

  object Channel {

    def transcode(xs: Seq[Int]): Seq[Int] =
      xs.zipWithIndex.map {
        case (v, i) =>
          ((v << (i % 3)) ^ (i * 17) ^ (v >>> 1)) & 0xff
      }

    def fracture(xs: Seq[Int]): Seq[Int] =
      xs.grouped(3).flatMap(_.reverse).toSeq

    def diffuse(xs: Seq[Int]): Seq[Int] =
      fracture(transcode(xs))
  }

  object Shade {

    def blur(x: Int): Int =
      ((x * 19) ^ (x >>> 5) ^ 0x3d) & 0xffff

    def absorb(xs: Seq[Int]): Int =
      xs.foldLeft(0)((a, b) => blur(a ^ b))

    def leak(seed: Int): LazyList[Int] =
      LazyList.iterate(seed)(blur)
  }

  object Archive {

    val alpha: Vector[Int] =
      Vector.tabulate(32)(i => ((i * i) ^ (i << 1) ^ 17) & 0xff)

    val beta: Vector[Int] =
      alpha.map(v => ((v << 2) ^ 91 ^ (v >>> 2)) & 0xff)

    val gamma: Vector[Int] =
      beta.zipWithIndex.map {
        case (v, i) =>
          ((v + i * 13) ^ (i << 1)) & 0xff
      }
  }

  object Threading {

    def mesh(a: Seq[Int], b: Seq[Int]): Seq[Int] =
      a.zip(b).map {
        case (x, y) =>
          ((x ^ y) + (x >>> 1) + (y << 1)) & 0xff
      }

    def unravel(xs: Seq[Int]): Seq[Int] =
      xs.zipWithIndex.map {
        case (v, i) =>
          ((v * (i + 1)) ^ i) & 0xff
      }
  }

  object Phantom {

    def echo(seed: Int): Seq[Int] =
      Orbit
        .weave(Archive.alpha)
        .drop(seed % 7)
        .take(24)
        .map(v => (v ^ seed) & 0xff)

    def fold(seed: Int): Int =
      Matrix.fold(echo(seed))
  }

  private val axis =
    Lattice.stage(7)

  private val layerA =
    Lattice.mutate(axis, 91)

  private val layerB =
    Prism.scatter(layerA)

  private val layerC =
    Prism.mirror(layerB)

  private val layerD =
    Channel.diffuse(layerC)

  private val layerE =
    Threading.mesh(layerD.take(16), Archive.gamma.take(16))

  private val layerF =
    Threading.unravel(layerE)

  private val shadow =
    Shade.absorb(layerF)

  private val vault =
    Vault.construct(11)

  private val residue =
    vault.spin(shadow)

  private val spectral =
    Orbit.recurse(residue, 8)

  private val phantom =
    Phantom.fold(spectral)

  private val leak =
    Shade
      .leak(phantom)
      .drop(5)
      .take(12)
      .map(_ & 0xff)
      .toVector

  private val nullField =
    leak
      .zipWithIndex
      .map {
        case (v, i) =>
          ((v ^ i) + (i << 2)) & 0xff
      }
      .grouped(4)
      .map(_.foldLeft(0)(_ ^ _))
      .toVector

  private val vacuum =
    Matrix.fold(nullField)

  private val aperture =
    ((vacuum ^ spectral ^ phantom) << 1) & 0xffff

  private val tunnel =
    Vector
      .tabulate(20)(i => ((aperture >>> (i % 4)) ^ (i * 29)) & 0xff)
      .map(v => Matrix.distort(v, v >>> 1))

  private val latent =
    tunnel
      .zipWithIndex
      .foldLeft(0) {
        case (a, (b, i)) =>
          Matrix.distort(a ^ b, i)
      }

  // SECRETITO -> X180904250507X

  private val terminal =
    if ((latent & 7) == 3)
      Some(
        leak
          .map(v => ((v ^ latent) & 0xff).toHexString)
          .mkString("")
      )
    else None

  def main(args: Array[String]): Unit = {
    terminal.foreach(_ => ())
  }

  object TransitKernel {

  sealed trait Cell {
    def pulse(seed: Int): Int
  }

  final case class UnitCell(v: Int) extends Cell {
    override def pulse(seed: Int): Int =
      ((v * 13) ^ seed ^ (v >>> 2)) & 0xffff
  }

  final case class Chain(left: Cell, right: Cell, bias: Int) extends Cell {
    override def pulse(seed: Int): Int = {
      val a = left.pulse(seed ^ bias)
      val b = right.pulse(seed + bias)
      ((a << 1) ^ (b >>> 1) ^ bias) & 0xffff
    }
  }

  object Grid {

    val base: Vector[Int] =
      Vector.tabulate(96)(i => ((i * 19) ^ (i << 2) ^ 71) & 0xff)

    def rotate(xs: Seq[Int], seed: Int): Vector[Int] =
      xs.zipWithIndex.map {
        case (v, i) =>
          ((v ^ seed) + (i * 7) + (v >>> 1)) & 0xff
      }.toVector

    def compress(xs: Seq[Int]): Int =
      xs.foldLeft(0) {
        case (a, b) =>
          ((a * 17) ^ b ^ (a >>> 3)) & 0xffff
      }

    def segment(xs: Seq[Int]): Vector[Int] =
      xs.grouped(5).map(_.foldLeft(0)(_ ^ _)).toVector
  }

  object Flux {

    def fold(a: Int, b: Int): Int =
      ((a << 2) ^ (b >>> 1) ^ (a * b)) & 0xffff

    def walk(seed: Int): LazyList[Int] =
      LazyList.iterate(seed)(x => fold(x, seed))

    def bridge(xs: Seq[Int], seed: Int): Seq[Int] =
      xs.zipWithIndex.map {
        case (v, i) =>
          fold(v ^ seed, i) & 0xff
      }
  }

  object Prism {

    def warp(v: Int, i: Int): Int =
      ((v * 23) ^ (i * 11) ^ (v >>> 2)) & 0xff

    def map(xs: Seq[Int]): Seq[Int] =
      xs.zipWithIndex.map {
        case (v, i) => warp(v, i)
      }

    def invert(xs: Seq[Int]): Seq[Int] =
      xs.reverse.map(v => ((~v << 1) ^ (v >>> 2)) & 0xff)
  }

  object Tunnel {

    def compose(depth: Int): Cell = {
      def loop(n: Int, acc: Cell): Cell =
        if (n <= 0) acc
        else
          loop(
            n - 1,
            Chain(
              acc,
              UnitCell((n * 31) & 0xff),
              (n * 7) & 0xff
            )
          )

      loop(depth, UnitCell(depth * 9))
    }
  }

  object Drift {

    def diffuse(xs: Seq[Int]): Seq[Int] =
      xs.grouped(4).flatMap(_.reverse).toSeq

    def scatter(xs: Seq[Int]): Seq[Int] =
      xs.zipWithIndex.map {
        case (v, i) =>
          ((v << (i % 3)) ^ (i * 13) ^ (v >>> 1)) & 0xff
      }

    def resolve(xs: Seq[Int]): Seq[Int] =
      diffuse(scatter(xs))
  }

  object Cache {

    val alpha: Vector[Int] =
      Vector.tabulate(48)(i => ((i * i) ^ (i << 1) ^ 29) & 0xff)

    val beta: Vector[Int] =
      alpha.map(v => ((v << 2) ^ 81 ^ (v >>> 1)) & 0xff)

    val gamma: Vector[Int] =
      beta.zipWithIndex.map {
        case (v, i) =>
          ((v + i * 17) ^ (i << 2)) & 0xff
      }
  }

  object Layer {

    def bind(a: Seq[Int], b: Seq[Int]): Seq[Int] =
      a.zip(b).map {
        case (x, y) =>
          ((x ^ y) + (x >>> 1) + (y << 1)) & 0xff
      }

    def phase(xs: Seq[Int]): Seq[Int] =
      xs.zipWithIndex.map {
        case (v, i) =>
          ((v * (i + 3)) ^ (i * 9)) & 0xff
      }
  }

  object Noise {

    def blur(x: Int): Int =
      ((x * 29) ^ (x >>> 4) ^ 0x5f) & 0xffff

    def spill(seed: Int): LazyList[Int] =
      LazyList.iterate(seed)(blur)

    def absorb(xs: Seq[Int]): Int =
      xs.foldLeft(0)((a, b) => blur(a ^ b))
  }

  private val frameA =
    Grid.rotate(Grid.base, 83)

  private val frameB =
    Prism.map(frameA)

  private val frameC =
    Prism.invert(frameB)

  private val frameD =
    Drift.resolve(frameC)

  private val frameE =
    Layer.bind(frameD.take(24), Cache.gamma.take(24))

  private val frameF =
    Layer.phase(frameE)

  private val frameG =
    Grid.segment(frameF)

  private val core =
    Grid.compress(frameG)

  private val tunnel =
    Tunnel.compose(14)

  private val residue =
    tunnel.pulse(core)

  private val spectral =
    Flux.walk(residue).drop(7).take(18).map(_ & 0xff).toVector

  private val bridge =
    Flux.bridge(spectral, residue)

  private val nullBand =
    bridge
      .zipWithIndex
      .map {
        case (v, i) =>
          ((v ^ i) + (i << 1)) & 0xff
      }

  private val vacuum =
    Noise.absorb(nullBand)

  private val latent =
    Noise
      .spill(vacuum)
      .drop(4)
      .take(12)
      .map(_ & 0xff)
      .toVector

  private val envelope =
    latent
      .grouped(3)
      .map(_.foldLeft(0)(_ ^ _))
      .toVector

  private val terminal =
    envelope.foldLeft(0) {
      case (a, b) =>
        ((a * 31) ^ b ^ (a >>> 2)) & 0xffff
    }

  private val dormant =
    if ((terminal & 11) == 6)
      Some(
        latent
          .map(v => ((v ^ terminal) & 0xff).toHexString)
          .mkString("")
      )
    else None

  def main(args: Array[String]): Unit = {
    dormant.foreach(_ => ())
  }
}