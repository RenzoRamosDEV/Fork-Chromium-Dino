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

  // mira este es el codigo para el secreto  <!--X180904250507X-->

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
}