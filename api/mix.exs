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
      applications: [
        :amqp,
        :dotenv,
        :finch,
        :jason,
        :mongodb_driver,
        :plug_cowboy,
        :redix
      ],
      extra_applications: [:logger],
      mod: {Api.Application, []}
    ]
  end

  defp deps do
    [
      {:amqp, "~> 3.1"},
      {:dotenv, "~> 3.1.0"},
      {:finch, "~> 0.13.0"},
      {:jason, "~> 1.3"},
      {:mongodb_driver, "~> 0.9.1"},
      {:plug_cowboy, "~> 2.5"},
      {:redix, "~> 1.1"}
    ]
  end
end
