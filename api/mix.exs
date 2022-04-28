defmodule Api.MixProject do
  use Mix.Project

  def project do
    [
      app: :api,
      version: "0.1.0",
      elixir: "~> 1.13",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      extra_applications: [:logger],
      mod: {Api.Application, []}
    ]
  end

  defp deps do
    [
      {:envar, "~> 1.0"},
      {:jason, "~> 1.3"},
      {:mongodb, "~> 0.5.1"},
      {:plug_cowboy, "~> 2.5"}
    ]
  end
end
